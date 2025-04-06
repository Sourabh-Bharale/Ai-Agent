export interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: any;
  state: string;
  result?: any;
}

export interface AgentModeData {
  toolName: string;
  args: any;
  result: any;
}


// Define interface types for GitHub API responses
export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  location: string | null;
  company: string | null;
  blog: string | null;
  twitter_username: string | null;
  public_gists: number;
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  language: string | null;
  html_url: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author?: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
}

export interface GitHubPullRequest {
  id: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  repository_url: string;
  pull_request: {
    html_url: string;
    merged_at: string | null;
  };
}

export interface GitHubIssue {
  id: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  repository_url: string;
  comments_url: string;
  pull_request?: {
    html_url: string;
    merged_at: string | null;
  };
}

export interface GitHubComment {
  id: number;
  body: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
  };
}

// Response mapped types
export interface CommitDetails {
  sha: string;
  message: string;
  url: string;
  date: string;
}

export interface RepoCommits {
  repo: string;
  commits: CommitDetails[];
}

export interface PullRequestDetails {
  title: string;
  state: string;
  created_at: string;
  url: string;
  repo: string;
}

export interface IssueDetails {
  title: string;
  state: string;
  created_at: string;
  url: string;
  repo: string;
}

export interface CommentDetails {
  body: string;
  created_at: string;
  url: string;
  on: string;
  type: 'pull request' | 'issue';
  repo: string;
}

export interface TimelineActivity {
  type: 'commit' | 'pull_request' | 'issue' | 'comment';
  date: string;
  repo: string;
  details: CommitDetails | PullRequestDetails | IssueDetails | CommentDetails;
}

// Response structure
export interface GitHubActivityResponse {
  user: {
    login: string;
    name: string;
    avatar_url: string;
    bio: string | null;
    followers: number;
    following: number;
  };
  period: {
    since: string;
    until: string;
    formattedDate: string;
  };
  stats: {
    totalContributions: number;
    commits: number;
    pullRequests: number;
    issues: number;
    comments: number;
    repositoriesContributed: string[];
  };
  activity: {
    commits: RepoCommits[];
    pullRequests: PullRequestDetails[];
    issues: IssueDetails[];
    comments: CommentDetails[];
    timeline: TimelineActivity[];
  };
}

// Error response
export interface GitHubActivityError {
  error: string;
  message: string;
}



export interface GitHubActor {
  id: number;
  login: string;
  display_login: string;
  gravatar_id: string;
  url: string;
  avatar_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  url: string;
}

export interface GitHubOrg {
  id: number;
  login: string;
  gravatar_id: string;
  url: string;
  avatar_url: string;
}

export interface GitHubCommit {
  sha: string;
  author: {
    email: string;
    name: string;
  };
  message: string;
  distinct: boolean;
  url: string;
}

export interface GitHubPushEventPayload {
  push_id: number;
  size: number;
  distinct_size: number;
  ref: string;
  head: string;
  before: string;
  commits: GitHubCommit[];
}

export interface GitHubCreateEventPayload {
  ref: string | null;
  ref_type: string;
  master_branch: string;
  description: string | null;
  pusher_type: string;
}

export interface GitHubIssueEventPayload {
  action: string;
  issue: {
    number: number;
    title: string;
    url: string;
  };
}

export interface GitHubPullRequestEventPayload {
  action: string;
  number: number;
  pull_request: {
    title: string;
    url: string;
    html_url: string;
    state: string;
  };
}

export interface GitHubReleaseEventPayload {
  action: string;
  release: {
    url: string;
    html_url: string;
    assets_url: string;
    tag_name: string;
    name: string;
    draft: boolean;
    prerelease: boolean;
  };
}

export interface GitHubCommentEventPayload {
  action: string;
  issue: {
    number: number;
    title: string;
    url: string;
  };
  comment: {
    url: string;
    html_url: string;
    body: string;
  };
}

// Union type for all possible event payloads
export type GitHubEventPayload =
  | GitHubPushEventPayload
  | GitHubCreateEventPayload
  | GitHubIssueEventPayload
  | GitHubPullRequestEventPayload
  | GitHubReleaseEventPayload
  | GitHubCommentEventPayload
  | Record<string, any>;  // Fallback for other event types

export interface GitHubEvent {
  id: string;
  type: string;
  actor: GitHubActor;
  repo: GitHubRepo;
  payload: GitHubEventPayload;
  public: boolean;
  created_at: string;
  org?: GitHubOrg;
}

export interface EventsResponse {
  user: string;
  events: {
    totalCount: number;
    items: Array<{
      id: string;
      type: string;
      actor: string;
      actorUrl: string;
      actorAvatar: string;
      repo: string;
      repoUrl: string;
      createdAt: string;
      description: string;
    }>;
  };
  pagination: {
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}