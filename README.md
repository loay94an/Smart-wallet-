# المحفظة المالية الذكية | Smart Wallet

تطبيق مالي عربي RTL مبني باستخدام React وVite. يحفظ بياناتك محليًا على الجهاز عبر IndexedDB، ويتيح تصدير التقارير والنسخ الاحتياطية، مع مزامنة سحابية اختيارية مشفرة.

## تشغيل نسخة الويب

**المتطلبات:** Node.js 22 أو أحدث.

```bash
npm install
npm run dev
```

لبناء ملفات الويب:

```bash
npm run lint
npm run build
```

## تطبيق Android

يتم التحقق من البناء الأصلي عبر GitHub Actions قبل إصدار أي APK.

تم إعداد التطبيق كتطبيق Android فعلي باستخدام Capacitor 8، مع الاحتفاظ بواجهة React ووظائفها الحالية داخل WebView محلي. لا يحتاج التطبيق إلى اتصال إنترنت لتشغيل الوظائف المحلية بعد تثبيته.

**التوافق:** Android 7.0 (API 24) أو أحدث، مع WebView محدث.

### إنشاء مشروع Android محليًا

```bash
npm install
npm run build
npm run android:init
npx cap sync android
npx cap open android
```

### إنشاء APK تجريبي

بعد إنشاء مجلد `android/`:

```bash
npm run android:debug
```

سيكون APK في:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### تنزيل APK من GitHub Actions

يعمل سير البناء `Smart Wallet quality checks` عند فتح طلب دمج للتغييرات أو بعد دمجها في `main`. بعد نجاح البناء، افتح صفحة Actions للمستودع، واختر تشغيل Android، ثم نزّل artifact باسم `smart-wallet-android-debug`.

## المزامنة السحابية على Android

تخزين البيانات المحلي يعمل دون خادم. المزامنة السحابية تحتاج نشر `server.ts` على استضافة Node.js تدعم HTTPS، لأن نسخة Android لا تستطيع استخدام مسار API النسبي الخاص بموقع الويب.

بعد نشر الخادم:
1. أضف إلى إعدادات بيئة الخادم `CORS_ORIGINS=https://localhost,capacitor://localhost,https://loay94an.github.io`.
2. افتح نافذة **المزامنة السحابية** داخل التطبيق.
3. أدخل عنوان الخادم بصيغة HTTPS، مثل `https://api.example.com`.
4. استخدم رمز المزامنة نفسه على أجهزتك.

لا تضع عنوان خادم HTTP عام أو بيانات سرية في ملفات التطبيق. يجب تحديث نسخة Android والويب معًا للاستفادة من بروتوكول المزامنة المشفر.

## ملاحظات الإصدار

- نسخة Android الحالية تُبنى كـ APK تجريبي Debug، وليست APK موقّعًا للنشر في Google Play.
- لم تُضف مفاتيح توقيع إنتاجية إلى المستودع.
- لا يعني نجاح بناء APK أن جميع مسارات الاستخدام اختُبرت على جهاز فعلي؛ يلزم اختبار التثبيت والتشغيل والحفظ والاستعادة على هاتف Android قبل النشر.


تم تثبيت حزم Android SDK المطلوبة صراحةً في مسار البناء الآلي لتجنب حزمة SDK القديمة `tools` التي أوقفتها Google.
