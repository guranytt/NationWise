import asyncio
from sqlalchemy import text
from app.database import engine

async def main():
    async with engine.begin() as conn:
        # Check existing buckets
        res = await conn.execute(text("SELECT id, name, public FROM storage.buckets;"))
        buckets = res.fetchall()
        print("Existing buckets:", buckets)

        # Create candidate-pdfs bucket if it doesn't exist
        await conn.execute(text("""
            INSERT INTO storage.buckets (id, name, public)
            VALUES ('candidate-pdfs', 'candidate-pdfs', true)
            ON CONFLICT (id) DO UPDATE SET public = true;
        """))

        # Create storage policy to allow public select and authenticated/anon uploads if needed
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for candidate-pdfs'
                ) THEN
                    CREATE POLICY "Public Access for candidate-pdfs"
                    ON storage.objects FOR SELECT
                    USING (bucket_id = 'candidate-pdfs');
                END IF;
            END $$;
        """))
        print("Successfully created/updated 'candidate-pdfs' bucket in Supabase storage!")

if __name__ == "__main__":
    asyncio.run(main())
