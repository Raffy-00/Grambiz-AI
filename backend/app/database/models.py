import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=True)
    phone_or_email = Column(String, nullable=True)
    village = Column(String, nullable=True)
    district = Column(String, nullable=True)
    preferred_language = Column(String, default="en")
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

class AssessmentRecord(Base):
    __tablename__ = "assessments"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    
    village = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    
    margin_capital = Column(Float, nullable=False)
    business_category = Column(String, nullable=False)
    experience = Column(String, nullable=True)
    
    project_cost = Column(Float, nullable=False)
    loan_amount = Column(Float, nullable=False)
    scheme_name = Column(String, nullable=False)
    feasibility_score = Column(Integer, nullable=False)
    
    raw_json_data = Column(JSON, nullable=False)

class AnalysisDraft(Base):
    __tablename__ = "analysis_drafts"

    id = Column(String, primary_key=True, index=True) # user_id or unique session key
    user_id = Column(String, index=True, nullable=False)
    current_step = Column(Integer, default=1)
    business_data = Column(JSON, nullable=True)
    location_data = Column(JSON, nullable=True)
    capital_data = Column(JSON, nullable=True)
    feasibility_data = Column(JSON, nullable=True)
    completed_steps = Column(JSON, nullable=True)
    last_platform = Column(String, default="web") # "web" or "mobile"
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc))

class ChatMessageRecord(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    role = Column(String, nullable=False) # "user" or "assistant"
    content = Column(Text, nullable=False)
    timestamp = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

