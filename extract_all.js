const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function parseText(text, gender) {
    const records = [];
    const lines = text.split('\n');
    for (const rawLine of lines) {
        const line = rawLine.trim();
        const m = line.match(/^(\d+)\s+(\d{9,12})\s+(.+)$/);
        if (!m) continue;

        const roll = m[2];
        const rest = m[3].trim();
        const parts = rest.split(/\s{2,}/);
        
        let name = '';
        let cat = '';
        if (parts.length >= 1) {
            name = parts[0].trim();
        }
        if (parts.length >= 2) {
            // Category is the last item
            const lastPart = parts[parts.length - 1].trim();
            // Category in SSC is usually a digit (0: EWS, 1: SC, 2: ST, 3: ESM, 6: OBC, 9: UR, etc.)
            cat = lastPart;
        }

        records.push({ roll, name, cat, g: gender });
    }
    return records;
}

async function run() {
    console.log("Reading LIST1 (Female)...");
    const d1 = await pdf(fs.readFileSync('LIST1_12102026.pdf'));
    const rec1 = parseText(d1.text, 'F');
    console.log(`LIST1 parsed: ${rec1.length} candidates`);

    console.log("Reading LIST2 (Male)...");
    const d2 = await pdf(fs.readFileSync('LIST2_12102026.pdf'));
    const rec2 = parseText(d2.text, 'M');
    console.log(`LIST2 parsed: ${rec2.length} candidates`);

    const all = [...rec1, ...rec2];
    console.log(`Total qualified candidates: ${all.length}`);

    // Group by first 4 digits of roll number
    const shards = {};
    const validPrefixes = new Set();

    for (const r of all) {
        const prefix = r.roll.slice(0, 4);
        validPrefixes.add(prefix);
        if (!shards[prefix]) {
            shards[prefix] = {};
        }
        shards[prefix][r.roll] = [r.name, r.cat, r.g];
    }

    console.log(`Writing ${Object.keys(shards).length} shard files to /data ...`);
    for (const [prefix, data] of Object.entries(shards)) {
        fs.writeFileSync(
            path.join(dataDir, `${prefix}.json`),
            JSON.stringify(data)
        );
    }

    // Also write an index of valid prefixes and meta info
    fs.writeFileSync(
        path.join(dataDir, 'prefixes.json'),
        JSON.stringify(Array.from(validPrefixes).sort())
    );

    console.log("Extraction and sharding completed successfully!");
}

run().catch(console.error);
