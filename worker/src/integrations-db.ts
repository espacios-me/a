}

/**
 * Create or update an integration with encrypted credentials
 */
export async function upsertIntegration(
  userId: number,
  provider: string,
  data: {
    status: 'connected' | 'disconnected' | 'error';
    token?: string;
    refreshToken?: string;
    credentials?: Record<string, any>;
    expiresAt?: Date;
    metadata?: Record<string, any>;
    errorMessage?: string;
  }
): Promise<Integration> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const encryptedToken = data.token ? encryptCredential(data.token, ENV.cookieSecret) : null;
  const encryptedRefreshToken = data.refreshToken ? encryptCredential(data.refreshToken, ENV.cookieSecret) : null;
  const encryptedCredentials = data.credentials ? encryptCredential(JSON.stringify(data.credentials), ENV.cookieSecret) : null;

  const insertData: InsertIntegration = {
    userId,
    provider,
    status: data.status,
    encryptedToken: encryptedToken || undefined,
    encryptedRefreshToken: encryptedRefreshToken || undefined,
    encryptedCredentials: encryptedCredentials || undefined,
    expiresAt: data.expiresAt,
    metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    errorMessage: data.errorMessage,
    lastSyncedAt: new Date(),
  };

  const existing = await getUserIntegration(userId, provider);

  if (existing) {
    await db
      .update(integrations)
      .set(insertData)
      .where(and(eq(integrations.userId, userId), eq(integrations.provider, provider)));

    const updated = await getUserIntegration(userId, provider);
    return updated!;
  } else {
    await db.insert(integrations).values(insertData);