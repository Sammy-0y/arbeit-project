# This file will be imported into server.py
# Contains candidate management endpoints

candidate_endpoints_code = '''
# ============ CANDIDATE MANAGEMENT (Phase 4) ============

@api_router.post("/candidates/upload", response_model=CandidateResponse)
async def upload_candidate_cv(
    job_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload CV and create candidate with AI parsing"""
    # Only admin/recruiter can upload candidates
    if current_user["role"] not in ["admin", "recruiter"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin/recruiter can upload candidates"
        )
    
    # Verify job exists and get job details
    job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Generate candidate_id
    candidate_id = f"cand_{uuid.uuid4().hex[:8]}"
    
    # Save CV file
    cv_url = await save_cv_file(file, candidate_id)
    
    # Extract text from CV (simple text extraction for now)
    cv_text = f"CV for parsing - File: {file.filename}"
    # In production, use PyPDF2 or similar for actual text extraction
    
    # Parse CV with AI
    parsed_resume = await parse_cv_with_ai(cv_text)
    
    # Generate candidate story
    candidate_data_for_story = {
        "name": parsed_resume.name,
        "current_role": parsed_resume.current_role,
        "skills": parsed_resume.skills,
        "experience": parsed_resume.experience
    }
    ai_story = await generate_candidate_story(candidate_data_for_story, job)
    
    # Create candidate document
    candidate_doc = {
        "candidate_id": candidate_id,
        "job_id": job_id,
        "name": parsed_resume.name,
        "current_role": parsed_resume.current_role,
        "email": parsed_resume.email,
        "phone": parsed_resume.phone,
        "linkedin": parsed_resume.linkedin,
        "skills": parsed_resume.skills,
        "experience": parsed_resume.experience,
        "education": parsed_resume.education,
        "summary": parsed_resume.summary,
        "cv_file_url": cv_url,
        "cv_text_original": cv_text,
        "cv_text_redacted": redact_text(cv_text),
        "ai_story": ai_story.model_dump(),
        "status": "NEW",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["email"]
    }
    
    await db.candidates.insert_one(candidate_doc)
    
    return CandidateResponse(
        candidate_id=candidate_id,
        job_id=job_id,
        name=parsed_resume.name,
        current_role=parsed_resume.current_role,
        skills=parsed_resume.skills,
        experience=parsed_resume.experience,
        education=parsed_resume.education,
        summary=parsed_resume.summary,
        cv_file_url=cv_url,
        ai_story=ai_story,
        status="NEW",
        created_at=candidate_doc["created_at"],
        created_by=current_user["email"]
    )

@api_router.post("/candidates", response_model=CandidateResponse)
async def create_candidate_manual(
    candidate_data: CandidateCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create candidate manually without CV upload"""
    # Only admin/recruiter can create candidates
    if current_user["role"] not in ["admin", "recruiter"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin/recruiter can create candidates"
        )
    
    # Verify job exists
    job = await db.jobs.find_one({"job_id": candidate_data.job_id}, {"_id": 0})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    candidate_id = f"cand_{uuid.uuid4().hex[:8]}"
    
    # Generate AI story
    ai_story = await generate_candidate_story(candidate_data.model_dump(), job)
    
    candidate_doc = {
        "candidate_id": candidate_id,
        "job_id": candidate_data.job_id,
        "name": candidate_data.name,
        "current_role": candidate_data.current_role,
        "email": candidate_data.email,
        "phone": candidate_data.phone,
        "skills": candidate_data.skills,
        "experience": candidate_data.experience,
        "education": candidate_data.education,
        "summary": candidate_data.summary,
        "cv_file_url": None,
        "ai_story": ai_story.model_dump(),
        "status": "NEW",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["email"]
    }
    
    await db.candidates.insert_one(candidate_doc)
    
    return CandidateResponse(
        candidate_id=candidate_id,
        job_id=candidate_data.job_id,
        name=candidate_data.name,
        current_role=candidate_data.current_role,
        skills=candidate_data.skills,
        experience=candidate_data.experience,
        education=candidate_data.education,
        summary=candidate_data.summary,
        cv_file_url=None,
        ai_story=ai_story,
        status="NEW",
        created_at=candidate_doc["created_at"],
        created_by=current_user["email"]
    )

@api_router.get("/jobs/{job_id}/candidates", response_model=list[CandidateResponse])
async def list_job_candidates(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """List all candidates for a job"""
    # Verify job exists and user has access
    job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Tenant check for client users
    if current_user["role"] == "client_user":
        if job["client_id"] != current_user["client_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    candidates = await db.candidates.find(
        {"job_id": job_id},
        {"_id": 0}
    ).to_list(1000)
    
    result = []
    for cand in candidates:
        result.append(CandidateResponse(
            candidate_id=cand["candidate_id"],
            job_id=cand["job_id"],
            name=cand["name"],
            current_role=cand.get("current_role"),
            skills=cand.get("skills", []),
            experience=cand.get("experience", []),
            education=cand.get("education", []),
            summary=cand.get("summary"),
            cv_file_url=cand.get("cv_file_url"),
            ai_story=CandidateStory(**cand["ai_story"]) if cand.get("ai_story") else None,
            status=cand["status"],
            created_at=cand["created_at"],
            created_by=cand["created_by"]
        ))
    
    return result

@api_router.get("/candidates/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get candidate details"""
    candidate = await db.candidates.find_one({"candidate_id": candidate_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Verify job access
    job = await db.jobs.find_one({"job_id": candidate["job_id"]}, {"_id": 0})
    if current_user["role"] == "client_user":
        if job["client_id"] != current_user["client_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    return CandidateResponse(
        candidate_id=candidate["candidate_id"],
        job_id=candidate["job_id"],
        name=candidate["name"],
        current_role=candidate.get("current_role"),
        skills=candidate.get("skills", []),
        experience=candidate.get("experience", []),
        education=candidate.get("education", []),
        summary=candidate.get("summary"),
        cv_file_url=candidate.get("cv_file_url"),
        ai_story=CandidateStory(**candidate["ai_story"]) if candidate.get("ai_story") else None,
        status=candidate["status"],
        created_at=candidate["created_at"],
        created_by=candidate["created_by"]
    )

@api_router.get("/candidates/{candidate_id}/cv")
async def get_candidate_cv(
    candidate_id: str,
    redacted: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Get candidate CV (redacted or full)"""
    candidate = await db.candidates.find_one({"candidate_id": candidate_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Verify job access
    job = await db.jobs.find_one({"job_id": candidate["job_id"]}, {"_id": 0})
    if current_user["role"] == "client_user":
        if job["client_id"] != current_user["client_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        # Client users always get redacted version
        redacted = True
    
    cv_text = candidate.get("cv_text_redacted") if redacted else candidate.get("cv_text_original")
    
    return {
        "candidate_id": candidate_id,
        "cv_text": cv_text,
        "is_redacted": redacted
    }

@api_router.put("/candidates/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(
    candidate_id: str,
    update_data: CandidateUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update candidate information"""
    candidate = await db.candidates.find_one({"candidate_id": candidate_id})
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Verify access
    job = await db.jobs.find_one({"job_id": candidate["job_id"]}, {"_id": 0})
    if current_user["role"] == "client_user":
        if job["client_id"] != current_user["client_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        # Client users can only update status
        allowed_fields = {"status"}
        update_dict = update_data.model_dump(exclude_unset=True)
        if not all(k in allowed_fields for k in update_dict.keys()):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Client users can only update status"
            )
    
    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update data provided"
        )
    
    await db.candidates.update_one(
        {"candidate_id": candidate_id},
        {"$set": update_dict}
    )
    
    updated_candidate = await db.candidates.find_one({"candidate_id": candidate_id}, {"_id": 0})
    
    return CandidateResponse(
        candidate_id=updated_candidate["candidate_id"],
        job_id=updated_candidate["job_id"],
        name=updated_candidate["name"],
        current_role=updated_candidate.get("current_role"),
        skills=updated_candidate.get("skills", []),
        experience=updated_candidate.get("experience", []),
        education=updated_candidate.get("education", []),
        summary=updated_candidate.get("summary"),
        cv_file_url=updated_candidate.get("cv_file_url"),
        ai_story=CandidateStory(**updated_candidate["ai_story"]) if updated_candidate.get("ai_story") else None,
        status=updated_candidate["status"],
        created_at=updated_candidate["created_at"],
        created_by=updated_candidate["created_by"]
    )

@api_router.post("/candidates/{candidate_id}/regenerate-story", response_model=CandidateResponse)
async def regenerate_candidate_story(
    candidate_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Regenerate AI candidate story"""
    # Only admin/recruiter can regenerate
    if current_user["role"] not in ["admin", "recruiter"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin/recruiter can regenerate stories"
        )
    
    candidate = await db.candidates.find_one({"candidate_id": candidate_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    job = await db.jobs.find_one({"job_id": candidate["job_id"]}, {"_id": 0})
    
    # Generate new story
    ai_story = await generate_candidate_story(candidate, job)
    
    await db.candidates.update_one(
        {"candidate_id": candidate_id},
        {"$set": {"ai_story": ai_story.model_dump()}}
    )
    
    updated_candidate = await db.candidates.find_one({"candidate_id": candidate_id}, {"_id": 0})
    
    return CandidateResponse(
        candidate_id=updated_candidate["candidate_id"],
        job_id=updated_candidate["job_id"],
        name=updated_candidate["name"],
        current_role=updated_candidate.get("current_role"),
        skills=updated_candidate.get("skills", []),
        experience=updated_candidate.get("experience", []),
        education=updated_candidate.get("education", []),
        summary=updated_candidate.get("summary"),
        cv_file_url=updated_candidate.get("cv_file_url"),
        ai_story=ai_story,
        status=updated_candidate["status"],
        created_at=updated_candidate["created_at"],
        created_by=updated_candidate["created_by"]
    )
'''
