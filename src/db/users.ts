import { db } from './index.ts';
import { profiles, adminEmails } from './schema.ts';
import { eq } from 'drizzle-orm';
import {
  findDemoUserByEmail,
  findDemoUserByUid,
  addDemoUser,
  updateDemoUser,
} from './demoStore.ts';

function generateAnonymousId(uid: string): string {
  const hash = Math.abs(
    uid.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0)
  ).toString(16).toUpperCase().padStart(4, '0').slice(0, 4);
  return `Citizen #CF-${hash}`;
}

export async function isAuthorizedAdmin(email: string): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  // Known administrator emails
  if (
    cleanEmail === 'admin@ghmc.gov.in' ||
    cleanEmail === 'admin@civicfix.gov' ||
    cleanEmail === 'municipal.admin@civicfix.gov'
  ) {
    return true;
  }

  // Check demo store
  const demo = findDemoUserByEmail(cleanEmail);
  if (demo && demo.role === 'admin') {
    return true;
  }

  try {
    const rows = await db
      .select()
      .from(adminEmails)
      .where(eq(adminEmails.email, cleanEmail))
      .limit(1);
    return rows.length > 0;
  } catch (err) {
    // If DB check fails, rely on static / demo check above
    return false;
  }
}

export async function getOrCreateProfile(
  uid: string,
  email: string,
  displayName?: string,
  role?: 'admin' | 'worker' | 'supervisor' | 'citizen'
) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const isAdmin = await isAuthorizedAdmin(cleanEmail);
  const resolvedRole = isAdmin ? 'admin' : role || 'citizen';
  const anonId = generateAnonymousId(uid);

  try {
    // Check existing in DB
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.uid, uid))
      .limit(1);

    if (existing.length > 0) {
      const user = existing[0];
      // Sync admin status or explicit role if changed
      if ((isAdmin && user.role !== 'admin') || (role && role !== user.role && !isAdmin)) {
        const [updated] = await db
          .update(profiles)
          .set({ role: resolvedRole, updatedAt: new Date() })
          .where(eq(profiles.uid, uid))
          .returning();
        return updated;
      }
      return user;
    }

    // Insert new profile into DB
    const [inserted] = await db
      .insert(profiles)
      .values({
        uid,
        email: cleanEmail,
        displayName: displayName || (resolvedRole === 'admin' ? 'Civic Administrator' : 'Citizen'),
        role: resolvedRole,
        anonymousPublicId: anonId,
      })
      .onConflictDoUpdate({
        target: profiles.uid,
        set: {
          email: cleanEmail,
          updatedAt: new Date(),
          role: resolvedRole,
        },
      })
      .returning();

    return inserted;
  } catch (error) {
    // Fallback to in-memory demoStore
    const existingDemo = findDemoUserByUid(uid) || findDemoUserByEmail(cleanEmail);
    if (existingDemo) {
      return {
        id: existingDemo.id,
        uid: existingDemo.uid,
        email: existingDemo.email,
        displayName: existingDemo.displayName,
        role: resolvedRole,
        anonymousPublicId: existingDemo.anonymousPublicId,
        phone: existingDemo.phone,
        municipalityId: existingDemo.municipalityId,
        isAdmin: resolvedRole === 'admin',
      };
    }

    const created = addDemoUser({
      uid,
      email: cleanEmail,
      name: displayName || cleanEmail.split('@')[0],
      displayName: displayName || (resolvedRole === 'admin' ? 'Civic Administrator' : 'Citizen'),
      role: resolvedRole,
      anonymousPublicId: anonId,
      phone: null,
      municipalityId: 1,
      isAdmin: resolvedRole === 'admin',
    });

    return {
      id: created.id,
      uid: created.uid,
      email: created.email,
      displayName: created.displayName,
      role: created.role,
      anonymousPublicId: created.anonymousPublicId,
      phone: created.phone,
      municipalityId: created.municipalityId,
      isAdmin: created.isAdmin,
    };
  }
}

export async function getProfileByUid(uid: string) {
  try {
    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.uid, uid))
      .limit(1);
    if (rows.length > 0) return rows[0];
  } catch (error) {
    // Continue to demoStore check
  }

  const demo = findDemoUserByUid(uid);
  if (demo) {
    return {
      id: demo.id,
      uid: demo.uid,
      email: demo.email,
      displayName: demo.displayName,
      role: demo.role,
      anonymousPublicId: demo.anonymousPublicId,
      phone: demo.phone,
      municipalityId: demo.municipalityId,
      isAdmin: demo.isAdmin,
    };
  }

  return null;
}

