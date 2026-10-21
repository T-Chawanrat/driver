# TMS Driver

Frontend แยกสำหรับคนขับรถ ออกแบบ Mobile-first และใช้ backend เดิมของ Mini TMS

## เริ่มใช้งาน

1. คัดลอก `.env.example` เป็น `.env`
2. ตั้ง `VITE_API_URL` ให้ชี้ไปที่ backend เดิม เช่น `http://localhost:8001`
3. รัน `npm install`
4. รัน `npm run dev`

Login ใช้ API จริง `POST /driver/login` และเก็บ token แยกจากหน้า admin ด้วย key `driver_token`.

หน้าจอ DT, ยิง SN, ปิดงาน และแชทยังใช้ state ตัวอย่างจากต้นแบบ `client/src/pages/Driver/DriverMockup.tsx` เพื่อวาง UX Mobile-first ก่อนเชื่อม endpoint คนขับจริง. Backend ต้องเพิ่ม endpoint ที่จำกัดข้อมูลตาม `req.user.id` ก่อนนำไปใช้งานจริง.
