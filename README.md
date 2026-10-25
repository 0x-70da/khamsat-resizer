# Khamsat Image Resizer

أداة بتغيّر أبعاد الصور لمتطلبات خمسات، والمعالجة كلها في المتصفح بـ [pica](https://github.com/nodeca/pica).

- الصورة الرئيسية: 1700×970
- معرض الأعمال: 800×460

```bash
pnpm install
pnpm dev     # تطوير
pnpm build   # يطلع dist/ جاهز للنشر كـ static
```

الأبعاد في `src/lib/presets.ts`، ومنطق المعالجة في `src/lib/resize.ts`.
