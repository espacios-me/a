/**
 * Tool definitions for Gemini to interact with integrated accounts
 * These tools enable the AI to perform actions like reading files, emails, repos, etc.
 */

export const GEMINI_TOOLS = [
  {
    name: 'list_google_drive_files',
    description: 'List files from the user\'s Google Drive',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for files (e.g., "*.pdf", "documents")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of files to return (default: 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'read_google_drive_file',
    description: 'Read content from a Google Drive file',
    input_schema: {
      type: 'object',
      properties: {
        file_id: {
          type: 'string',
          description: 'The ID of the file to read',
        },
      },
      required: ['file_id'],
    },
  },
  {
    name: 'list_github_repos',
    description: 'List repositories from the user\'s GitHub account',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of repositories to return (default: 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_github_repo_info',
    description: 'Get detailed information about a GitHub repository',
    input_schema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner username',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'list_github_commits',
    description: 'List recent commits from a GitHub repository',
    input_schema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner username',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of commits to return (default: 10)',
        },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'list_emails',
    description: 'List emails from the user\'s inbox',
    input_schema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: ['gmail', 'outlook'],
          description: 'Email provider',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of emails to return (default: 10)',
        },
        query: {
          type: 'string',
          description: 'Search query for emails (e.g., "from:user@example.com")',
        },
      },
      required: ['provider'],
    },
  },
  {
    name: 'read_email',
    description: 'Read the full content of an email',
    input_schema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: ['gmail', 'outlook'],
          description: 'Email provider',
        },
        email_id: {
          type: 'string',
          description: 'The ID of the email to read',
        },
      },
      required: ['provider', 'email_id'],
    },
  },
  {
    name: 'get_cloudflare_workers',
    description: 'List Cloudflare Workers',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_cloudflare_pages',
    description: 'List Cloudflare Pages projects',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_r2_objects',
    description: 'List objects in Cloudflare R2 storage',
    input_schema: {
      type: 'object',
      properties: {
        bucket: {
          type: 'string',
          description: 'R2 bucket name',
        },
        prefix: {
          type: 'string',
          description: 'Optional prefix to filter objects',
        },
      },
      required: ['bucket'],
    },
  },
  {
    name: 'get_integration_status',
    description: 'Check the connection status of an integration',
    input_schema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: ['google_drive', 'github', 'gmail', 'outlook', 'whatsapp', 'cloudflare'],
          description: 'The integration provider to check',
        },
      },
      required: ['provider'],
    },
  },
];

export type ToolName = 
  | 'list_google_drive_files'
  | 'read_google_drive_file'
  | 'list_github_repos'
  | 'get_github_repo_info'
  | 'list_github_commits'
  | 'list_emails'
  | 'read_email'
  | 'get_cloudflare_workers'
  | 'get_cloudflare_pages'
  | 'list_r2_objects'
  | 'get_integration_status';
