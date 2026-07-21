"""Initial schema - all tables

Revision ID: 001_initial
Revises: 
Create Date: 2026-06-24
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # teams
    op.create_table('teams',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('plan', sa.String(50), server_default='free'),
        sa.Column('settings', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # users
    op.create_table('users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('role', sa.String(50), server_default='employee'),
        sa.Column('status', sa.String(50), server_default='active'),
        sa.Column('team_id', sa.String(36), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # documents
    op.create_table('documents',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('team_id', sa.String(36), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('uploaded_by', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_type', sa.String(50), nullable=False),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=False),
        sa.Column('storage_path', sa.String(1024), nullable=False),
        sa.Column('status', sa.String(50), server_default='ready'),
        sa.Column('visibility', sa.String(50), server_default='team'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # knowledge_articles
    op.create_table('knowledge_articles',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('team_id', sa.String(36), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('summary', sa.String(500), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('created_by', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # agents
    op.create_table('agents',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('team_id', sa.String(36), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('trigger_type', sa.String(50), server_default='manual'),
        sa.Column('schedule_cron', sa.String(100), nullable=True),
        sa.Column('status', sa.String(50), server_default='idle'),
        sa.Column('is_shared_with_team', sa.Boolean(), server_default='true'),
        sa.Column('created_by', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('model', sa.String(100), server_default='Claude 3.5 Sonnet'),
        sa.Column('temperature', sa.Float(), server_default='0.2'),
        sa.Column('system_prompt', sa.Text(), nullable=True),
        sa.Column('tools', sa.JSON(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), server_default='0'),
        sa.Column('avatar_color', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # agent_runs
    op.create_table('agent_runs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('agent_id', sa.String(36), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('triggered_by', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(50), server_default='running'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('result_summary', sa.Text(), nullable=True),
    )

    # chats
    op.create_table('chats',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # chat_messages
    op.create_table('chat_messages',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('chat_id', sa.String(36), sa.ForeignKey('chats.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # workflows
    op.create_table('workflows',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('team_id', sa.String(36), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('status', sa.String(50), server_default='draft'),
        sa.Column('nodes', sa.JSON(), nullable=True),
        sa.Column('edges', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # usage_logs
    op.create_table('usage_logs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('team_id', sa.String(36), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('token_count', sa.Integer(), server_default='0'),
        sa.Column('cost_usd', sa.Numeric(10, 4), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('usage_logs')
    op.drop_table('workflows')
    op.drop_table('chat_messages')
    op.drop_table('chats')
    op.drop_table('agent_runs')
    op.drop_table('agents')
    op.drop_table('knowledge_articles')
    op.drop_table('documents')
    op.drop_table('users')
    op.drop_table('teams')
