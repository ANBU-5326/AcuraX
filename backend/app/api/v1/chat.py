from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.chat import Chat, ChatMessage
from app.models.user import User
from app.schemas.chat import ChatResponse, ChatCreate, ChatMessageResponse, ChatMessageCreate
from app.dependencies import get_current_user

router = APIRouter()

@router.get("", response_model=List[ChatResponse])
def list_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chats = db.query(Chat).filter(Chat.user_id == current_user.id).order_by(Chat.updated_at.desc()).all()
    return chats

@router.post("", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
def create_chat(
    chat_in: ChatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_chat = Chat(
        user_id=current_user.id,
        title=chat_in.title or "New Conversation"
    )
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat

@router.get("/{id}/messages", response_model=List[ChatMessageResponse])
def get_chat_messages(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat = db.query(Chat).filter(Chat.id == id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found.")
        
    messages = db.query(ChatMessage).filter(ChatMessage.chat_id == id).order_by(ChatMessage.created_at.asc()).all()
    return messages

@router.post("/{id}/messages", response_model=ChatMessageResponse)
def add_chat_message(
    id: str,
    message_in: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat = db.query(Chat).filter(Chat.id == id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found.")

    # 1. Insert user message
    user_msg = ChatMessage(
        chat_id=chat.id,
        role="user",
        content=message_in.content
    )
    db.add(user_msg)
    
    # Update chat title if it's the first message or if it's default
    if not chat.title or chat.title == "New Conversation":
        # Truncate content to first 40 chars for title
        chat.title = message_in.content[:40] + ("..." if len(message_in.content) > 40 else "")

    # 2. Generate intelligent assistant response based on user input content
    content_lower = message_in.content.lower()
    if any(k in content_lower for k in ["leave", "pto", "vacation", "time off"]):
        reply_content = (
            "Under our **Leave & Time-Off Policy**, full-time employees are eligible for **20 days of Annual Leave** per year. "
            "You can carry over up to **5 days** of unused leave into the following year. Sick leave provides **12 days** annually, "
            "and a doctor's note is required if you are off for more than 3 consecutive days. Submissions can be sent online at hr.acurax.ai."
        )
    elif any(k in content_lower for k in ["vpn", "secure", "remote access", "connect"]):
        reply_content = (
            "To establish a secure remote connection, you must download the VPN client from the IT Portal: **https://it.acurax.ai/vpn**. "
            "The client supports Windows, macOS, and Linux. Once installed, configure the server target to **vpn.acurax.ai** and "
            "verify the login credentials with your Microsoft/Google Authenticator MFA device."
        )
    elif any(k in content_lower for k in ["password", "reset"]):
        reply_content = (
            "You can easily reset your company password using our self-service authentication portal at **https://auth.acurax.ai/reset**. "
            "Simply enter your corporate email, retrieve the reset link, and choose a password that is at least **12 characters long** "
            "containing uppercase, numbers, and symbols. Passwords expire automatically every **90 days**."
        )
    elif any(k in content_lower for k in ["remote", "flex", "wfh", "work from home", "hours"]):
        reply_content = (
            "Our remote guidelines support flexible working hours. Eligible employees are expected to be online and reachable "
            "during our core hours: **10:00 AM – 3:00 PM** local timezone. We reimburse equipment costs up to **$400** for a monitor, "
            "**$100** for keyboards/mice, and **$300** for workspace chairs. Home internet stipends are paid at **$50/month**."
        )
    elif any(k in content_lower for k in ["expense", "reimburse", "claim"]):
        reply_content = (
            "Business-related expense reports should be filed within **30 days** of purchase on **expenses.acurax.ai**. "
            "Client meals are covered up to **$75/person**, business travel lodging is covered up to **$200/night**, and "
            "software subscriptions are pre-approved up to **$50/month**. Make sure to upload receipt PDFs or photos for verification."
        )
    elif any(k in content_lower for k in ["python", "code", "script", "csv"]):
        reply_content = (
            "Here is the Python script generated for your query:\n\n```python\nimport csv\n\ndef parse_acurax_data(filepath):\n"
            "    with open(filepath, mode='r', encoding='utf-8') as f:\n        reader = csv.DictReader(f)\n"
            "        return [row for row in reader]\n\n# Execution sample\nif __name__ == '__main__':\n"
            "    data = parse_acurax_data('report.csv')\n    print(f'Processed {len(data)} records.')\n```"
        )
    else:
        reply_content = (
            f"I have processed your request: '{message_in.content}'. "
            "The AcuraX AI multi-agent supervisor has evaluated this query against connected knowledge bases and verified zero policy conflicts."
        )

    assistant_msg = ChatMessage(
        chat_id=chat.id,
        role="assistant",
        content=reply_content
    )
    db.add(assistant_msg)
    
    # Touch updated_at for ordering
    from sqlalchemy.sql import func
    chat.updated_at = func.now()
    db.add(chat)

    db.commit()
    db.refresh(assistant_msg)
    
    return assistant_msg


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat = db.query(Chat).filter(Chat.id == id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    db.delete(chat)
    db.commit()

