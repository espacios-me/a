import { Octokit } from "@octokit/rest";

export async function getGitHubRepos(accessToken: string) {
  const octokit = new Octokit({
    auth: accessToken,
  });

  const { data } = await octokit.repos.listForAuthenticatedUser({
    type: "owner",
    sort: "updated",
    direction: "desc",
  });

  return data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    htmlUrl: repo.html_url,
    private: repo.private,
    updatedAt: repo.updated_at,
  }));
}
