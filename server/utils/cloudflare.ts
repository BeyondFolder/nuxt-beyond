export async function syncAutoRAG(autoRagInstance: string) {
  return await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/autorag/rags/${autoRagInstance}/sync`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_AUTO_RAG_API_TOKEN}`,
      },
    }
  );
}

export async function getAutoRAGJobDetail(autoRagInstance: string, jobId: string) {
  return await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/autorag/rags/${autoRagInstance}/jobs/${jobId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_AUTO_RAG_API_TOKEN}`,
      },
    }
  );
}
