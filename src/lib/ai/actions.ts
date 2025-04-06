import { EventsResponse,GitHubCommentEventPayload,GitHubCommit,GitHubCreateEventPayload,GitHubEvent,GitHubIssueEventPayload,GitHubPullRequestEventPayload,GitHubPushEventPayload,GitHubRepo, GitHubUser, RepoCommits } from '@/types';

// Export the execute function so it can be used in the route handler
export async function fetchGitHubUserDetails({ username, date }: { username: string; date?: string }) {
  try {
    // Fetch basic user information
    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Add your GitHub token if you have one to increase rate limits
        'Authorization': `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`
      }
    });

    if (!userResponse.ok) {
      throw new Error(`GitHub API error: ${userResponse.status}`);
    }

    const userData = await userResponse.json() as GitHubUser;

    // Get user's repositories to check for contributions
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`
      }
    });

    if (!reposResponse.ok) {
      throw new Error(`GitHub API error: ${reposResponse.status}`);
    }

    const reposData = await reposResponse.json() as GitHubRepo[];

    // If a specific date is provided, look for commits on that date
    let contributionData = null;

    if (date) {
      // Convert repos to an array of promises that fetch commits for each repo on the specified date
      const commitPromises = reposData.slice(0, 10).map(async (repo: GitHubRepo) => {
        try {
          const commitsResponse = await fetch(
            `https://api.github.com/repos/${username}/${repo.name}/commits?author=${username}&since=${date}T00:00:00Z&until=${date}T23:59:59Z`,
            {
              headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`
              }
            }
          );

          if (!commitsResponse.ok) {
            return { repo: repo.name, commits: [] };
          }

          const commitsData = await commitsResponse.json() as GitHubCommit[];
          return {
            repo: repo.name,
            commits: commitsData.map(commit => ({
              sha: commit.sha,
              message: commit.commit.message,
              url: commit.html_url
            }))
          };
        } catch (error) {
          console.error(`Error fetching commits for ${repo.name}:`, error);
          return { repo: repo.name, commits: [] };
        }
      });

      const repoCommits = await Promise.all(commitPromises) as RepoCommits[];
      const reposWithCommits = repoCommits.filter(rc => rc.commits.length > 0);

      contributionData = {
        date,
        totalCommits: reposWithCommits.reduce((sum, repo) => sum + repo.commits.length, 0),
        repositories: reposWithCommits
      };
    } else {
      // Without a specific date, provide general repo activity info
      contributionData = {
        recentRepositories: reposData.slice(0, 5).map((repo: GitHubRepo) => ({
          name: repo.name,
          description: repo.description,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          lastUpdated: repo.updated_at
        })),
        totalPublicRepos: userData.public_repos,
        topLanguages: [...new Set(reposData.slice(0, 20).map(repo => repo.language).filter(Boolean))]
      };
    }

    return {
      user: {
        login: userData.login,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        bio: userData.bio,
        public_repos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        created_at: userData.created_at,
        location: userData.location,
        company: userData.company,
        blog: userData.blog,
        twitter_username: userData.twitter_username,
        public_gists: userData.public_gists
      },
      contributions: contributionData
    };
  } catch (error: any) {
    console.error("Error fetching GitHub data:", error);
    return {
      error: "Failed to fetch GitHub data",
      message: error.message
    };
  }
}

export async function fetchGitHubEvents({
  username,
  from,
  to,
  perPage = 100,
}: {
  username: string;
  from: string; // "YYYY-MM-DD"
  to: string;   // "YYYY-MM-DD"
  perPage?: number;
}): Promise<EventsResponse | { error: string; message: string }> {
  try {
    const fromDate = new Date(`${from}T00:00:00Z`);
    const toDate = new Date(`${to}T23:59:59Z`);
    let page = 1;
    let events: EventsResponse['events']['items'] = [];
    let hasMore = true;

    while (hasMore) {
      const url = `https://api.github.com/users/${username}/events?page=${page}&per_page=${perPage}`;
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
      };

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data: GitHubEvent[] = await response.json();
      if (data.length < perPage) {
        hasMore = false;
      } else {
        page++;
      }

      const filteredEvents = await Promise.all(
        data
          .filter((event) => {
            const eventDate = new Date(event.created_at);
            return eventDate >= fromDate && eventDate <= toDate;
          })
          .map(async (event) => {
            let description = '';
            const repo = event.repo.name;
            const repoUrl = `https://github.com/${repo}`;
            const actor = event.actor.login;
            const actorUrl = `https://github.com/${actor}`;
            const actorAvatar = event.actor.avatar_url;

            switch (event.type) {
              case 'PushEvent': {
                const payload = event.payload as GitHubPushEventPayload;
                const branch = payload.ref?.replace('refs/heads/', '') || 'unknown branch';
                const commits = payload.commits || [];
                const commitCount = commits.length;

                const fullCommits = await Promise.all(commits.slice(0, 3).map(async (commit) => {
                  const res = await fetch(`https://api.github.com/repos/${repo}/commits/${commit.sha}`, { headers });
                  if (res.ok) {
                    const fullCommit = await res.json();
                    return `- ${fullCommit.commit.message}\n  🔗 ${fullCommit.html_url}`;
                  } else {
                    return `- ${commit.message}`;
                  }
                }));

                description = `Pushed ${commitCount} commit${commitCount === 1 ? '' : 's'} to ${branch} in ${repo}`;
                if (fullCommits.length > 0) description += `:\n${fullCommits.join('\n')}`;
                break;
              }
              case 'CreateEvent': {
                const payload = event.payload as GitHubCreateEventPayload;
                description = payload.ref_type === 'repository'
                  ? `Created repository ${repo}`
                  : `Created ${payload.ref_type} ${payload.ref || ''} in ${repo}`;
                break;
              }
              case 'IssuesEvent': {
                const payload = event.payload as GitHubIssueEventPayload;
                const issueDetailRes = await fetch(payload.issue.url, { headers });
                const issueDetail = issueDetailRes.ok ? await issueDetailRes.json() : payload.issue;
                description = `${capitalize(payload.action)} issue #${payload.issue.number}: ${payload.issue.title}`;
                if (issueDetail.body) {
                  description += `\n📝 ${issueDetail.body.slice(0, 150)}...`;
                }
                break;
              }
              case 'PullRequestEvent': {
                const payload = event.payload as GitHubPullRequestEventPayload;
                const pr = payload.pull_request;
                const prDetailRes = await fetch(pr.url, { headers });
                const prDetail = prDetailRes.ok ? await prDetailRes.json() : pr;
                description = `${capitalize(payload.action)} pull request #${payload.number}: ${pr.title}`;
                if (prDetail.body) {
                  description += `\n📄 ${prDetail.body.slice(0, 150)}...`;
                }
                break;
              }
              case 'IssueCommentEvent': {
                const payload = event.payload as GitHubCommentEventPayload;
                description = `${capitalize(payload.action)} comment on issue #${payload.issue.number}: \"${payload.comment.body.slice(0, 100)}...\"`;
                break;
              }
              case 'WatchEvent':
                description = `Starred ${repo}`;
                break;
              case 'ForkEvent':
                description = `Forked ${repo}`;
                break;
              default:
                description = `${event.type} in ${repo}`;
            }

            return {
              id: event.id,
              type: event.type,
              actor,
              actorUrl,
              actorAvatar,
              repo,
              repoUrl,
              createdAt: event.created_at,
              description,
            };
          })
      );

      events = events.concat(filteredEvents);
    }

    return {
      user: username,
      events: {
        totalCount: events.length,
        items: events,
      },
      pagination: {
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  } catch (error: any) {
    console.error("Error fetching GitHub events:", error);
    return {
      error: "Failed to fetch GitHub events",
      message: error.message,
    };
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
