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

    # 2. Insert mock assistant response
    assistant_msg = ChatMessage(
        chat_id=chat.id,
        role="assistant",
        content="This is a placeholder response. AI integration coming soon."
    )
    db.add(assistant_msg)
    
    # Touch updated_at for ordering
    from sqlalchemy.sql import func
    chat.updated_at = func.now()
    db.add(chat)

    db.commit()
    db.refresh(assistant_msg)
    
    # Return user message (or assistant message; the endpoint can return the assistant's message, 
    # but the frontend will usually fetch all messages or expect the response. Returning the assistant message 
    # lets the frontend display it instantly!)
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

