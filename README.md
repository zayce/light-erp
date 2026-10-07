# Hesabla

Anbar (inventar), alışlar və pul axını idarəetməsi üçün veb tətbiq. Dillər: Azərbaycan, Rus, İngilis.

## Mümkünlüklər
- **Giriş və rollar**: e-poçt + şifrə, admin və işçi. İlk qeydiyyatdan keçən istifadəçi admin olur, digərlərini admin əlavə edir (Parametrlər → İstifadəçilər).
- **Anbar**: məhsul əlavə etmə, tam redaktə formu (qiymət, maya, stok, kateqoriya...), cədvəldə sürətli redaktə, silmə + geri qaytarma, stok xəbərdarlığı, kamera ilə barkod skaneri, CSV ixrac.
- **Alışlar**: mal qəbulu. Stok artır, məbləğ Pul Axınına xərc kimi yazılır, maya dəyəri orta çəkili hesablanır.
- **Pul axını və hesabatlar**: satışlar anbar və pul axını ilə avtomatik əlaqəlidir; hər satışda maya dəyəri (COGS) saxlanılır.
- **İdarə paneli**: gəlir/xərc dinamikası, brüt mənfəət, ən çox gəlir gətirən məhsullar, stok vəziyyəti.
- **Məlumatlar serverdə saxlanılır** və bütün istifadəçilər arasında ortaqdır. Server əlçatan olmayanda tətbiq brauzerdəki lokal nüsxə ilə işləyir və qoşulma bərpa olunanda sinxronlaşır.
- **Ehtiyat nüsxə**: Parametrlər → Ehtiyat nüsxə (JSON yüklə / bərpa et).

## Quraşdırma

Frontend (port 3000):

```bash
npm install
cp .env.example .env     # lazım olduqda API ünvanını dəyişin
npm start
```

Server (port 5000):

```bash
cd server
npm install
npm start
```

İlk dəfə `http://localhost:3000` açanda giriş səhifəsi “İlk hesabı yaradın” formasını göstərir. Bu hesab admin olur.

Məlumatlar `server/data/hesabla.json` faylında saxlanılır (git-ə düşmür). Bu faylı mütəmadi ehtiyat nüsxələyin.

## Testlər

```bash
npm test              # frontend (Jest)
cd server && npm test # server (node:test)
```

## Mühit dəyişənləri

| Dəyişən | Harada | Standart |
| --- | --- | --- |
| `REACT_APP_API_URL` | frontend | `http://localhost:5000` |
| `PORT` | server | `5000` |
| `CORS_ORIGIN` | server | `http://localhost:3000` (vergüllə bir neçə ünvan) |
| `DATA_FILE` | server | `server/data/hesabla.json` |
| `JWT_SECRET` | server | təsadüfi açar yaradılıb bazada saxlanılır; production-da özünüz təyin edin |

Məsələn: `JWT_SECRET=uzun-gizli-soz CORS_ORIGIN=https://app.example.az node server.js`

## Server API

Bütün marşrutlar (`/health` və `/auth/status|register|login` istisna) `Authorization: Bearer <token>` tələb edir.

| Metod | Yol | Təsvir |
| --- | --- | --- |
| GET | `/health` | yoxlama |
| GET | `/auth/status` | istifadəçi var? (`hasUsers`) |
| POST | `/auth/register` | yalnız istifadəçi yoxdursa: ilk admin |
| POST | `/auth/login` | giriş (10 uğursuz cəhddən sonra 15 dəq blok) |
| GET | `/auth/me` | cari istifadəçi |
| PUT | `/auth/profile`, `/auth/notifications`, `/auth/password` | profil, bildirişlər, şifrə (şifrə dəyişəndə köhnə tokenlər ləğv olunur) |
| GET/POST/DELETE | `/users`, `/users/:id` | istifadəçilər (yalnız admin) |
| GET | `/data` | ortaq məlumatlar + `version` |
| PUT | `/data` | `{ baseVersion, data }`. Versiya köhnədirsə `409` və cari məlumat qaytarılır |

## Məlum məhdudiyyətlər
- Valyuta parametri yalnız simvolu dəyişir, məbləğləri çevirmir.
- Eyni anda iki cihazda dəyişiklik olarsa, serverdəki son versiya qalır (digər cihaz yenilənir).
- “İstifadəçi profili” (`/usepanels`) səhifəsi hələ yerli demo məlumatla işləyir.
- Məhsul şəkli yalnız fayl adı kimi saxlanılır.
