# G0 · Back-of-Envelope Estimation

---

## § POWER OF 2

```
2^10 ≈ 10^3   (1,024 — 2.4% error)
2^20 ≈ 10^6   (1,048,576 — 4.8% error)
2^30 ≈ 10^9   (1,073,741,824 — 7.4% error)
2^40 ≈ 10^12  (~10% error)
2^50 ≈ 10^15  (~13% error)
```

Root trick: `2^10 ≈ 10^3`. Each unit step = apply again. Error compounds but stays < 15% — same order of magnitude, fine for interviews.

---

## § STORAGE UNITS

╔══════════╦═══════════════╦══════════════╦══════════════════════════════════════╗
║ Power    ║ Exact bytes   ║ Unit         ║ Interview anchor                     ║
╠══════════╬═══════════════╬══════════════╬══════════════════════════════════════╣
║ 2^0      ║ 1             ║ Byte         ║ 1 ASCII char                         ║
║ 2^10     ║ 1,024         ║ Kilobyte     ║ metadata row, short msg              ║
║ 2^20     ║ 1,048,576     ║ Megabyte     ║ photo, 1 min audio                   ║
║ 2^30     ║ ~1 Billion    ║ Gigabyte     ║ HD movie, phone storage unit         ║
║ 2^40     ║ ~1 Trillion   ║ Terabyte     ║ 1 server disk, 1M photos             ║
║ 2^50     ║ ~1 Quadrillion║ Petabyte     ║ media platform yearly storage        ║
╚══════════╩═══════════════╩══════════════╩══════════════════════════════════════╝

**Unit conversion — each step = divide by 10^3 (knock 3 zeros):**
```
bytes → KB → MB → GB → TB → PB   (each ÷ 10^3)
```

---

## § POWER OF 10

╔══════════╦══════════════════╦══════════════╦══════════════════════════════════╗
║ Power    ║ Value            ║ Name         ║ Interview anchor                 ║
╠══════════╬══════════════════╬══════════════╬══════════════════════════════════╣
║ 10^1     ║ 10               ║ Ten          ║ —                                ║
║ 10^2     ║ 100              ║ Hundred      ║ —                                ║
║ 10^3     ║ 1,000            ║ Thousand     ║ 1K — small city DAU              ║
║ 10^4     ║ 10,000           ║ Ten K        ║ small app QPS                    ║
║ 10^5     ║ 100,000          ║ Hundred K    ║ 1 day in seconds ← memorize      ║
║ 10^6     ║ 1,000,000        ║ Million      ║ mid-size app DAU; 1 month in sec  ║
║ 10^7     ║ 10,000,000       ║ Ten M        ║ 1 year in seconds (~3×10^7)      ║
║ 10^8     ║ 100,000,000      ║ Hundred M    ║ Twitter/Instagram scale DAU      ║
║ 10^9     ║ 1,000,000,000    ║ Billion      ║ Facebook/WhatsApp DAU            ║
║ 10^10    ║ 10,000,000,000   ║ Ten B        ║ 10 GB in bytes                   ║
║ 10^11    ║ 100,000,000,000  ║ Hundred B    ║ 100 GB in bytes                  ║
║ 10^12    ║ 1,000,000,000,000║ Trillion     ║ 1 TB in bytes                    ║
║ 10^13    ║ 10^13            ║ Ten T        ║ 10 TB — mid storage cluster      ║
║ 10^14    ║ 10^14            ║ Hundred T    ║ 100 TB — large storage system    ║
║ 10^15    ║ 10^15            ║ Quadrillion  ║ 1 PB — media-heavy system/yr     ║
╚══════════╩══════════════════╩══════════════╩══════════════════════════════════╝

**Multiply rule:** `10^a × 10^b = 10^(a+b)` — add exponents, never multiply raw numbers.

**Example:** `1B users × 1KB data = 10^9 × 10^3 = 10^12 = 1 TB`

---

## § LATENCY NUMBERS

╔══════════════════════════════════════╦══════════════╗
║ Operation                            ║ Time         ║
╠══════════════════════════════════════╬══════════════╣
║ L1 cache ref                         ║ 0.5 ns       ║
║ Branch mispredict                    ║ 5 ns         ║
║ L2 cache ref                         ║ 7 ns         ║
║ Mutex lock/unlock                    ║ 100 ns       ║
║ Main memory ref                      ║ 100 ns       ║
║ Compress 1K w/ Snappy                ║ 10 µs        ║
║ Send 1K over 1Gbps                   ║ 10 µs        ║
║ Read 4K from SSD                     ║ 150 µs       ║
║ Round trip same DC                   ║ 500 µs       ║
║ Read 1M seq from SSD                 ║ 1 ms         ║
║ HDD seek                             ║ 10 ms        ║
║ Read 1M seq from HDD                 ║ 20 ms        ║
║ Packet CA→Netherlands→CA             ║ 150 ms       ║
╚══════════════════════════════════════╩══════════════╝

**Key ratios:** Mem 100× faster than SSD · SSD 100× faster than HDD · DC=500µs fast · Cross-continent=150ms slow

---

## § AVAILABILITY NUMBERS

╔════════════════╦══════════════╦═══════════════╗
║ Nines          ║ Downtime/yr  ║ Downtime/day  ║
╠════════════════╬══════════════╬═══════════════╣
║ 99%   (2 9s)   ║ 3.65 days    ║ 14.4 min      ║
║ 99.9% (3 9s)   ║ 8.77 hrs     ║ 1.44 min      ║
║ 99.99% (4 9s)  ║ 52.6 min     ║ 8.6 sec       ║
║ 99.999% (5 9s) ║ 5.26 min     ║ 0.86 sec      ║
╚════════════════╩══════════════╩═══════════════╝

---

## § QPS ESTIMATION

**Formula:**
```
avg QPS  = DAU × actions/day / 86,400
peak QPS = avg QPS × 2
```

**The trick — 86,400 ≈ 10^5** (~15% error, always acceptable)

**Fast table — per day → per second:**
```
1M/day   →     10/s
10M/day  →    100/s
100M/day →  1,000/s  (1K/s)
1B/day   → 10,000/s  (10K/s)
```

**3-step interview move:**
1. DAU × actions → events/day
2. Knock off 5 zeros → avg QPS
3. × 2 → peak QPS

**Example — Twitter:**
```
150M DAU × 2 tweets/day = 300M/day
300M / 10^5 = 3,000/s avg → peak = 6,000/s
```

---

## § STORAGE ESTIMATION

**Formula:**
```
storage = writes/day × record_size × retention_days
```

**Practical size anchors:**

╔═══════════════════════════╦═════════════╗
║ Thing                     ║ Size        ║
╠═══════════════════════════╬═════════════╣
║ ASCII char                ║ 1 B         ║
║ UUID / GUID               ║ 16 B        ║
║ DB row / metadata         ║ ~1 KB       ║
║ Tweet / short text        ║ 280B → 1KB  ║
║ Web page (HTML)           ║ ~100 KB     ║
║ Thumbnail image           ║ ~100 KB     ║
║ Full photo                ║ ~1 MB       ║
║ 1 min audio (MP3)         ║ ~1 MB       ║
║ 1 min video (HD)          ║ ~100 MB     ║
║ Full HD movie (2hr)       ║ ~2 GB       ║
╚═══════════════════════════╩═════════════╝

**Retention rounding:**
```
5 yr = 5 × 365 = 1,825 days ≈ 2,000 = 2 × 10^3
```

**Example — Twitter media (5yr retention):**
```
150M DAU × 10% media × 1MB = 15 × 10^6 × 10^6 = 15 × 10^12 = 15 TB/day
15 TB/day × 2 × 10^3 days = 30 × 10^15 = 30 PB
```
→ Petabyte-scale object store required.

---

## § SECONDS CHEATSHEET

╔══════════════╦══════════════╗
║ Period       ║ Seconds      ║
╠══════════════╬══════════════╣
║ 1 min        ║ 60           ║
║ 1 hr         ║ 3,600 ≈ 4K  ║
║ 1 day        ║ 86,400 ≈ 10^5║
║ 1 month      ║ 2.5M ≈ 10^6  ║
║ 1 year       ║ 31M ≈ 3×10^7 ║
╚══════════════╩══════════════╝

Memorize: **day=10^5, month=10^6** → covers 90% of interview math.

---

## § ROUNDING RULES

╔══════════════════╦══════════════════════════════════╗
║ Dimension        ║ Round direction                  ║
╠══════════════════╬══════════════════════════════════╣
║ Storage          ║ UP — never run out of disk       ║
║ QPS / traffic    ║ UP — never undersize servers     ║
║ Latency SLA      ║ DOWN — tighter = safer promise   ║
║ DAU              ║ UP — plan for growth             ║
╚══════════════════╩══════════════════════════════════╝

**Clean rounding targets — N ∈ {1, 2, 5} × 10^k only:**
```
1,825 → 2,000  ✓
86,400 → 100,000  ✓
3,600 → 4,000  ✓
```

---

## § GOTCHAS

- `10^14 bytes = 100 TB`, not 1 TB → `10^12 = 1 TB`, `10^14 = 100 × 10^12 = 100 TB`
- Media always dominates storage — call it out separately from text
- `2^10 ≈ 10^3` is approximation — error compounds per unit (max ~13% at PB)
- Peak = 2× avg is minimum; bursty systems → use 10×
- Always state assumptions out loud before calculating
