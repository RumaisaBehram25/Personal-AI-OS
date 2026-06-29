# HypoOS MVP — Database ERD

This document describes the database schema for the HypoOS MVP.

- `auth.users` is **managed by Supabase Auth** (email/password + Google). The app
  `users` table extends it; everything else hangs off the user id.
- Every app table carries a `user_id` so Row Level Security enforces
  "users can only access their own rows".
- Admin analytics and sensitive token/log access happen server-side using the
  Supabase **service role key** (no cross-user access is exposed through RLS).
- `messages.embedding` uses **pgvector** for semantic memory (relevant past-chat recall).
- `calendar_conn` (OAuth tokens) and `exec_logs` (writes) are server-only — see RLS notes.

---

## Mermaid ERD

> Renders automatically on GitHub. In VS Code / Cursor, open the Markdown preview
> (or install a Mermaid preview extension) to view it.

```mermaid
erDiagram
    auth_users ||--|| users : "extends"
    users ||--|| prefs : "has"
    users ||--o{ conversations : "owns"
    users ||--o{ messages : "owns"
    users ||--o{ tasks : "owns"
    users ||--o{ notes : "owns"
    users ||--o{ reminders : "owns"
    users ||--o{ expenses : "owns"
    users ||--o{ calendar_conn : "owns"
    users ||--o{ exec_logs : "owns"
    conversations ||--o{ messages : "contains"
    tasks ||--o{ reminders : "can trigger"
    messages ||--o{ exec_logs : "produced by"

    users {
        uuid id PK_FK "= auth.users.id"
        text email
        text full_name
        text avatar_url
        text role "user | admin"
        timestamptz created_at
        timestamptz updated_at
    }
    prefs {
        uuid id PK
        uuid user_id FK_UQ
        text timezone
        text currency
        jsonb preferences
        timestamptz updated_at
    }
    conversations {
        uuid id PK
        uuid user_id FK
        text title
        timestamptz created_at
        timestamptz updated_at
    }
    messages {
        uuid id PK
        uuid conversation_id FK
        uuid user_id FK
        text role "user|assistant|system|tool"
        text content
        jsonb tool_calls
        vector embedding "1536 - semantic memory"
        timestamptz created_at
    }
    tasks {
        uuid id PK
        uuid user_id FK
        text title
        text description
        text status "pending | completed"
        timestamptz due_at
        timestamptz completed_at
        timestamptz created_at
        timestamptz updated_at
    }
    notes {
        uuid id PK
        uuid user_id FK
        text title
        text content
        timestamptz created_at
        timestamptz updated_at
    }
    reminders {
        uuid id PK
        uuid user_id FK
        uuid task_id FK "nullable"
        text message
        timestamptz remind_at
        boolean is_sent
        text channel "in_app | email"
        timestamptz created_at
    }
    expenses {
        uuid id PK
        uuid user_id FK
        numeric amount
        text currency
        text category
        text description
        text source "manual | chat"
        timestamptz spent_at
        timestamptz created_at
    }
    calendar_conn {
        uuid id PK
        uuid user_id FK
        text provider "google"
        text account_email
        text access_token "server-only"
        text refresh_token "server-only"
        timestamptz token_expires_at
        text scope
        text calendar_id
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }
    exec_logs {
        uuid id PK
        uuid user_id FK
        uuid conversation_id FK "nullable"
        uuid message_id FK "nullable"
        text tool_name
        jsonb arguments
        jsonb result
        text status "success | error"
        text error_message
        int duration_ms
        timestamptz created_at
    }
```

### How to read it
- `||--||` = one-to-one (each user has one `prefs` row; `users` extends `auth.users`).
- `||--o{` = one-to-many (a user owns many tasks, expenses, etc.; a conversation contains many messages).
- `reminders.task_id` is the optional link from a reminder to a task.
- `exec_logs` records each AI tool/function call (debug, reliability, admin metrics).

### Access model (client vs server)
| Table | Client (anon key + RLS) | Server (service role) |
|---|---|---|
| `users`, `prefs`, `conversations`, `messages`, `tasks`, `notes`, `reminders`, `expenses` | own rows only | full |
| `calendar_conn` | none (tokens are secrets) | full |
| `exec_logs` | read own rows only | full (writes + admin metrics) |

---

## DBML (for https://dbdiagram.io)

Paste the block below into dbdiagram.io to get a draggable visual ERD you can edit.

```dbml
// HypoOS MVP schema — paste into https://dbdiagram.io

Table auth_users {
  id uuid [pk, note: 'Supabase-managed']
  email text
}

Table users {
  id uuid [pk, note: '= auth.users.id']
  email text
  full_name text
  avatar_url text
  role text [note: 'user | admin']
  created_at timestamptz
  updated_at timestamptz
}

Table prefs {
  id uuid [pk]
  user_id uuid [unique]
  timezone text
  currency text
  preferences jsonb
  updated_at timestamptz
}

Table conversations {
  id uuid [pk]
  user_id uuid
  title text
  created_at timestamptz
  updated_at timestamptz
}

Table messages {
  id uuid [pk]
  conversation_id uuid
  user_id uuid
  role text [note: 'user|assistant|system|tool']
  content text
  tool_calls jsonb
  embedding vector [note: '1536 dims - pgvector semantic memory']
  created_at timestamptz
}

Table tasks {
  id uuid [pk]
  user_id uuid
  title text
  description text
  status text [note: 'pending | completed']
  due_at timestamptz
  completed_at timestamptz
  created_at timestamptz
  updated_at timestamptz
}

Table notes {
  id uuid [pk]
  user_id uuid
  title text
  content text
  created_at timestamptz
  updated_at timestamptz
}

Table reminders {
  id uuid [pk]
  user_id uuid
  task_id uuid [note: 'nullable']
  message text
  remind_at timestamptz
  is_sent boolean
  channel text [note: 'in_app | email']
  created_at timestamptz
}

Table expenses {
  id uuid [pk]
  user_id uuid
  amount numeric
  currency text
  category text
  description text
  source text [note: 'manual | chat']
  spent_at timestamptz
  created_at timestamptz
}

Table calendar_conn {
  id uuid [pk]
  user_id uuid
  provider text [note: 'google']
  account_email text
  access_token text [note: 'server-only / sensitive']
  refresh_token text [note: 'server-only / sensitive']
  token_expires_at timestamptz
  scope text
  calendar_id text
  is_active boolean
  created_at timestamptz
  updated_at timestamptz
}

Table exec_logs {
  id uuid [pk]
  user_id uuid
  conversation_id uuid [note: 'nullable']
  message_id uuid [note: 'nullable']
  tool_name text
  arguments jsonb
  result jsonb
  status text [note: 'success | error']
  error_message text
  duration_ms int
  created_at timestamptz
}

// Relationships
Ref: users.id > auth_users.id
Ref: prefs.user_id > auth_users.id
Ref: conversations.user_id > auth_users.id
Ref: messages.user_id > auth_users.id
Ref: messages.conversation_id > conversations.id
Ref: tasks.user_id > auth_users.id
Ref: notes.user_id > auth_users.id
Ref: reminders.user_id > auth_users.id
Ref: reminders.task_id > tasks.id
Ref: expenses.user_id > auth_users.id
Ref: calendar_conn.user_id > auth_users.id
Ref: exec_logs.user_id > auth_users.id
Ref: exec_logs.conversation_id > conversations.id
Ref: exec_logs.message_id > messages.id
```
