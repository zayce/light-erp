# Hesabla

Anbar (inventar), alışlar və pul axını idarəetməsi üçün veb tətbiq. Dillər: Azərbaycan, Rus, İngilis.

## Mümkünlüklər
- **Giriş və rollar**: e-poçt + şifrə; rollar: admin, işçi, anbarçı, mühasibatçı. İlk qeydiyyatdan keçən istifadəçi admin olur, digərlərini admin əlavə edir (sol menyu → İstifadəçilər, `/usepanels`).
- **İstifadəçilər səhifəsi** (admin): axtarış, rol/status filtri, sıralama, səhifələmə, toplu aktiv/deaktiv/silmə, silməni geri qaytarma (6 san.), şifrə dəyişmə, CSV ixrac. Deaktiv edilən istifadəçi daxil ola bilməz və açıq sessiyaları bağlanır.
- **Rollar bölmələrə girişi idarə edir**: admin hər şeyi və istifadəçiləri görür; işçi istifadəçilərdən başqa hər şeyi; anbarçı yalnız Anbar və Alışları; mühasibatçı İdarə Paneli, Alışlar, Pul Axını və Hesabatları. Sistem parametrləri və ehtiyat nüsxə yalnız admin və işçiyə açıqdır. **Diqqət:** bu giriş nəzarətidir, məlumat izolyasiyası deyil. Anbar, kassa və hesabatlar bir-biri ilə bağlıdır (satış stoku azaldır və kassaya yazılır), buna görə məlumatlar bütün komanda üçün ortaq bir sahədə saxlanılır (`/data`). Əsl məlumat səviyyəsində məhdudiyyət üçün `/data` bölmələrə ayrılmalıdır.
- **Fəaliyyət jurnalı** (admin): kim kimi yaratdı, dəyişdi, aktiv/deaktiv etdi, şifrəsini dəyişdi və ya sildi. Son 1000 qeyd saxlanılır, şifrələr jurnala düşmür.
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
| GET | `/users/activity?limit&offset` | fəaliyyət jurnalı, ən yenisi birinci (yalnız admin) |
| GET/POST | `/users` | istifadəçilər siyahısı / yeni istifadəçi (yalnız admin) |
| PUT | `/users/:id` | ad, e-poçt, telefon, rol, `active` (deaktiv etmə). Admin öz rolunu dəyişə və özünü deaktiv edə bilməz (yalnız admin) |
| DELETE | `/users/:id` | istifadəçini sil (yalnız admin, özünü silmək olmaz) |
| PUT | `/users/:id/password` | admin həmkarına yeni şifrə təyin edir (yalnız admin) |
| GET | `/data` | ortaq məlumatlar + `version` |
| PUT | `/data` | `{ baseVersion, data }`. Versiya köhnədirsə `409` və cari məlumat qaytarılır |

## Məlum məhdudiyyətlər
- Valyuta parametri yalnız simvolu dəyişir, məbləğləri çevirmir.
- Eyni anda iki cihazda dəyişiklik olarsa, serverdəki son versiya qalır (digər cihaz yenilənir).
- Məhsul şəkli yalnız fayl adı kimi saxlanılır.
