import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const DAILY_LIMIT = 95;

async function searchYouTube(exerciseName: string): Promise<string | null> {
  const query = `${exerciseName} exercise form demo`;
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: "1",
    videoDuration: "short",
    key: YOUTUBE_API_KEY,
  });

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    );
    if (!res.ok) {
      const err = await res.text();
      console.error(`  YouTube API error: ${res.status} — ${err}`);
      return null;
    }

    const data = await res.json();
    const item = data.items?.[0];
    if (!item?.id?.videoId) return null;

    return `https://www.youtube.com/watch?v=${item.id.videoId}`;
  } catch (err) {
    console.error(`  Fetch error:`, err);
    return null;
  }
}

async function main() {
  if (!YOUTUBE_API_KEY) {
    console.error("Missing YOUTUBE_API_KEY environment variable.");
    process.exit(1);
  }

  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("id, name, muscle_group")
    .is("video_url", null)
    .eq("is_archived", false)
    .order("name")
    .limit(DAILY_LIMIT);

  if (error) {
    console.error("Failed to fetch exercises:", error);
    return;
  }

  console.log(
    `Found ${exercises.length} exercises without video URLs (max ${DAILY_LIMIT}/run).\n`
  );

  let updated = 0;
  let skipped = 0;

  for (const exercise of exercises) {
    const url = await searchYouTube(exercise.name);

    if (url) {
      const { error: updateError } = await supabase
        .from("exercises")
        .update({ video_url: url })
        .eq("id", exercise.id);

      if (updateError) {
        console.error(
          `  ✗ ${exercise.name}: update failed —`,
          updateError.message
        );
      } else {
        console.log(`  ✓ ${exercise.name}: ${url}`);
        updated++;
      }
    } else {
      console.log(`  — ${exercise.name}: no result`);
      skipped++;
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

main();
