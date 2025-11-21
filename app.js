const axios = require('axios');
require('dotenv').config();

const TOKEN = process.env.SIBANGKOM_TOKEN || '';
const MATERI_CONTEXT_ID = process.env.MATERI_CONTEXT_ID || '6c3ae3c0-59a4-4f98-a400-cfa75ce4b6fa';
const PARALLEL = String(process.env.PARALLEL || 'false').toLowerCase() === 'true';
const CONCURRENCY = Number(process.env.CONCURRENCY || 5);

// Master type dari curl utama (ganti jika perlu)
const MASTER_TYPE_UUID = 'ffcafe0e-86bc-4f35-8fff-4b97f7920997';

async function getMateriWajib() {
  const url = `https://sibangkom-mandiri.lan.go.id/swajar-cache-reader/api/materi/v2/getmateriwajib/${MASTER_TYPE_UUID}`;

  const res = await axios.get(url, {
    headers: {
      'accept': '*/*',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Authorization': `Bearer ${TOKEN}`,
      'ngrok-skip-browser-warning': 'true',
      'origin': 'https://sibangkom.lan.go.id',
      'referer': 'https://sibangkom.lan.go.id/',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'
    }
  });

  return res.data?.materiList || [];
}

async function getProgressBySubmateri(subMateriId) {
  const url = `https://sibangkom-mandiri.lan.go.id/swajar-cache-reader/api/progressmateri/v2/getprogressmateribysubmateri/${subMateriId}/${MATERI_CONTEXT_ID}?cb=${Date.now()}`;

  const res = await axios.get(url, {
    headers: {
      'accept': '*/*',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Authorization': `Bearer ${TOKEN}`,
      'ngrok-skip-browser-warning': 'true',
      'origin': 'https://sibangkom.lan.go.id',
      'referer': 'https://sibangkom.lan.go.id/',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'
    }
  });

  const data = Array.isArray(res.data) ? res.data : [];
  return data.filter((it) => it && it.status === false);
}

async function getCompletedBySubmateri(subMateriId) {
  const url = `https://sibangkom-mandiri.lan.go.id/swajar-cache-reader/api/progressmateri/v2/getprogressmateribysubmateri/${subMateriId}/${MATERI_CONTEXT_ID}?cb=${Date.now()}`;

  const res = await axios.get(url, {
    headers: {
      'accept': '*/*',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Authorization': `Bearer ${TOKEN}`,
      'ngrok-skip-browser-warning': 'true',
      'origin': 'https://sibangkom.lan.go.id',
      'referer': 'https://sibangkom.lan.go.id/',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'
    }
  });

  const data = Array.isArray(res.data) ? res.data : [];
  return data.filter((it) => it && it.status === true);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function setProgress(bahanId) {
  const url = `https://sibangkom-mandiri.lan.go.id/swajar-transaction/api/v2/progressmateri/setprogressmateri/${MATERI_CONTEXT_ID}/${bahanId}`;

  const res = await axios.post(
    url,
    {},
    {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'sec-ch-ua-platform': '"Android"',
        'Authorization': `Bearer ${TOKEN}`,
        'Referer': 'https://sibangkom.lan.go.id/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
        'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        'sec-ch-ua-mobile': '?1'
      }
    }
  );

  return res.data;
}

// Simple concurrency runner
async function runWithConcurrency(tasks, limit) {
  const results = [];
  let i = 0;
  const workers = new Array(Math.min(limit, tasks.length)).fill(0).map(async () => {
    while (i < tasks.length) {
      const idx = i++;
      try {
        results[idx] = await tasks[idx]();
      } catch (e) {
        results[idx] = { error: e };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const INTER_ITEM_DELAY_MS = 300;

  try {
    if (!TOKEN) {
      throw new Error('SIBANGKOM_TOKEN env var is empty');
    }
    const materiList = await getMateriWajib();
    console.log('Jumlah materi:', Array.isArray(materiList) ? materiList.length : 0);
    if (!Array.isArray(materiList) || materiList.length === 0) {
      console.log('Peringatan: materiList kosong. Cek MASTER_TYPE_UUID atau token.');
    }

    const MAX_ROUNDS = 50;
    const RECHECK_DELAY_MS = 3000;

    for (let round = 1; round <= MAX_ROUNDS; round++) {
      let totalOk = 0;
      let totalFail = 0;
      let totalPending = 0;
      console.log(`\n=== Putaran ${round} ===`);

      for (const materi of materiList) {
        const materiName = materi.namaMateri || materi.judulMateri;
        const subMateriArr = Array.isArray(materi.subMateri) ? materi.subMateri : [];
        console.log(`\nMateri: ${materiName} - Submateri: ${subMateriArr.length}`);

        for (const sub of subMateriArr) {
          // Ambil hanya pending (status false)
          let pending = [];
          try {
            pending = await getProgressBySubmateri(sub.id);
          } catch (e) {
            console.log(`  Sub: ${sub.namaSubMateri} (${sub.id}) - Gagal ambil progress:`, e.response ? e.response.status : e.message);
            continue;
          }
          if (pending.length === 0) continue;

          totalPending += pending.length;
          let okSub = 0;
          let failSub = 0;
          console.log(`  Sub: ${sub.namaSubMateri} - Pending: ${pending.length}${PARALLEL ? ` (parallel x${Math.min(CONCURRENCY, pending.length)})` : ''}`);

          if (PARALLEL) {
            const tasks = pending.map((item) => {
              const bahan = item.bahan || {};
              const bahanId = bahan.id;
              const nama = bahan.namaBahan;
              return async () => {
                try {
                  await setProgress(bahanId);
                  okSub++;
                  console.log(`    [OK] ${nama}`);
                  return { ok: true };
                } catch (e) {
                  failSub++;
                  const status = e.response ? e.response.status : 'ERR';
                  console.error(`    [FAIL ${status}] ${nama}`);
                  return { ok: false };
                }
              };
            });
            const results = await runWithConcurrency(tasks, CONCURRENCY);
            totalOk += results.filter((r) => r && r.ok).length;
            totalFail += results.filter((r) => r && r.ok === false).length;
          } else {
            for (const item of pending) {
              const bahan = item.bahan || {};
              const bahanId = bahan.id;
              const nama = bahan.namaBahan;
              try {
                await setProgress(bahanId);
                okSub++;
                totalOk++;
                console.log(`    [OK] ${nama}`);
              } catch (e) {
                if (e.response) {
                  failSub++;
                  totalFail++;
                  console.error(`    [FAIL ${e.response.status}] ${nama}`);
                } else {
                  failSub++;
                  totalFail++;
                  console.error(`    [ERROR] ${nama} -> ${e.message}`);
                }
              }
              await sleep(INTER_ITEM_DELAY_MS);
            }
          }
          console.log(`  Ringkas Sub: OK=${okSub}, FAIL=${failSub}`);
        }
      }

      console.log(`\nRingkas Total Putaran ${round}: Pending=${totalPending}, OK=${totalOk}, FAIL=${totalFail}`);

      // Cek ulang apakah masih ada pending; jika tidak, selesai
      let remaining = 0;
      for (const materi of materiList) {
        const subMateriArr = Array.isArray(materi.subMateri) ? materi.subMateri : [];
        for (const sub of subMateriArr) {
          try {
            const p = await getProgressBySubmateri(sub.id);
            remaining += p.length;
          } catch (_) {}
        }
      }
      if (remaining === 0) {
        console.log(`\nSelesai: tidak ada pending tersisa.`);
        break;
      }
      if (round < MAX_ROUNDS) {
        console.log(`\nMasih tersisa ${remaining} pending. Tunggu ${RECHECK_DELAY_MS}ms lalu ulang...`);
        await sleep(RECHECK_DELAY_MS);
      } else {
        console.log(`\nBatas putaran tercapai. Pending tersisa: ${remaining}`);
      }
    }
  } catch (err) {
    console.error('Kesalahan:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    }
  }
}

main();