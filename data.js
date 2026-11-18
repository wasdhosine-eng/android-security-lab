/* بيانات المختبر التجريبية — كل المحتوى وهمي ولأغراض تعليمية فقط */

const DEMO_APPS = {
  notes: {
    name: "DemoNotes — تطبيق ملاحظات نظيف",
    files: {
      "AndroidManifest.xml": {
        type: "xml",
        desc: "مكونات التطبيق والصلاحيات (هنا صلاحية الإنترنت فقط)",
        text: `<manifest package="com.lab.notes">
  <uses-permission android:name="android.permission.INTERNET" />
  <application>
    <activity android:name=".MainActivity" />
  </application>
</manifest>`
      },
      "smali/com/lab/notes/MainActivity.smali": {
        type: "smali",
        desc: "وظائف الواجهة الرئيسية وتهيئة مخزن الملاحظات",
        text: `.class public Lcom/lab/notes/MainActivity;
.super Landroid/app/Activity;
.field private store:Lcom/lab/notes/NoteStore;

.method protected onCreate(Landroid/os/Bundle;)V
    .registers 3
    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V
    new-instance v0, Lcom/lab/notes/NoteStore;
    invoke-direct {v0, p0}, Lcom/lab/notes/NoteStore;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, Lcom/lab/notes/MainActivity;->store:Lcom/lab/notes/NoteStore;
    return-void
.end method`
      },
      "smali/com/lab/notes/NoteStore.smali": {
        type: "smali",
        desc: "حفظ الملاحظات محلياً على الجهاز",
        text: `.class public Lcom/lab/notes/NoteStore;
.super Ljava/lang/Object;
.field private prefs:Landroid/content/SharedPreferences;

.method public constructor <init>(Landroid/content/Context;)V
    .registers 3
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    const-string v0, "notes_v1"
    invoke-virtual {p1, v0, 0}, Landroid/content/Context;->getSharedPreferences(Ljava/lang/String;I)Landroid/content/SharedPreferences;
    return-void
.end method`
      },
      "smali/com/lab/notes/net/UpdateChecker.smali": {
        type: "smali",
        desc: "التحقق من وجود نسخة أحدث من التطبيق عبر الشبكة",
        text: `.class public Lcom/lab/notes/net/UpdateChecker;
.super Ljava/lang/Object;

.method public check()V
    .registers 3
    const-string v0, "https://example.com/notes/version.json"
    new-instance v1, Ljava/net/URL;
    invoke-direct {v1, v0}, Ljava/net/URL;-><init>(Ljava/lang/String;)V
    invoke-virtual {v1}, Ljava/net/URL;->openConnection()Ljava/net/URLConnection;
    return-void
.end method`
      },
      "assets/config.json": {
        type: "json",
        desc: "إعدادات التطبيق: السمة والحفظ التلقائي وعنوان التحديث",
        text: `{
  "theme": "dark",
  "autosave": true,
  "update_url": "https://example.com/notes/version.json"
}`
      },
      "res/layout/activity_main.xml": {
        type: "xml",
        desc: "تصميم شاشة الملاحظات",
        text: `<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android">
  <EditText android:id="@+id/note" android:hint="اكتب ملاحظة" />
</LinearLayout>`
      },
      "resources.arsc": {
        type: "bin",
        desc: "موارد التطبيق المترجمة (ملف ثنائي)",
        text: "(ملف ثنائي مضغوط — لا يُعرض نصياً في هذه المحاكاة)"
      }
    }
  },

  tracker: {
    name: "LabTracker — تجريبي مشبوه (للتعليم فقط)",
    files: {
      "AndroidManifest.xml": {
        type: "xml",
        desc: "مكونات التطبيق والصلاحيات — لاحظ الجمع بين الميكروفون والخلفية والإقلاع التلقائي",
        text: `<manifest package="com.lab.tracker">
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.RECORD_AUDIO" />
  <uses-permission android:name="android.permission.READ_CONTACTS" />
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
  <application>
    <receiver android:name=".BootReceiver" />
    <service android:name=".sync.SyncService" />
  </application>
</manifest>`
      },
      "smali/com/lab/tracker/MainActivity.smali": {
        type: "smali",
        desc: "واجهة بسيطة لا تحتوي سلوكاً مريباً",
        text: `.class public Lcom/lab/tracker/MainActivity;
.super Landroid/app/Activity;

.method protected onCreate(Landroid/os/Bundle;)V
    .registers 2
    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V
    const-string v0, "Welcome"
    return-void
.end method`
      },
      "smali/com/lab/tracker/BootReceiver.smali": {
        type: "smali",
        desc: "يستقبل حدث إقلاع الجهاز ويشغّل خدمة المزامنة",
        text: `.class public Lcom/lab/tracker/BootReceiver;
.super Landroid/content/BroadcastReceiver;

.method public onReceive(Landroid/content/Context;Landroid/content/Intent;)V
    .registers 4
    new-instance v0, Landroid/content/Intent;
    const-class v1, Lcom/lab/tracker/sync/SyncService;
    invoke-direct {v0, p1, v1}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V
    invoke-virtual {p1, v0}, Landroid/content/Context;->startService(Landroid/content/Intent;)Landroid/content/ComponentName;
    return-void
.end method`
      },
      "smali/com/lab/tracker/sync/SyncService.smali": {
        type: "smali",
        desc: "الخدمة الخلفية: تبدأ التسجيل وترفع المقاطع وتخفي الأيقونة (سلوك مشبوه في هذه العينة)",
        text: `.class public Lcom/lab/tracker/sync/SyncService;
.super Landroid/app/Service;
.field private uploader:Lcom/lab/tracker/net/Uploader;

.method public onStartCommand(Landroid/content/Intent;II)I
    .registers 5
    invoke-virtual {p0}, Lcom/lab/tracker/sync/SyncService;->startSilentRecording()V
    invoke-virtual {p0}, Lcom/lab/tracker/sync/SyncService;->uploadAudioChunk()V
    invoke-virtual {p0}, Lcom/lab/tracker/sync/SyncService;->hideLauncherIcon()V
    const/4 v0, 0x1
    return v0
.end method

.method private startSilentRecording()V
    .registers 2
    new-instance v0, Lcom/lab/tracker/audio/Recorder;
    invoke-direct {v0}, Lcom/lab/tracker/audio/Recorder;-><init>()V
    invoke-virtual {v0}, Lcom/lab/tracker/audio/Recorder;->start()V
    return-void
.end method

.method private uploadAudioChunk()V
    .registers 1
    return-void
.end method

.method private hideLauncherIcon()V
    .registers 1
    return-void
.end method`
      },
      "smali/com/lab/tracker/audio/Recorder.smali": {
        type: "smali",
        desc: "وحدة تسجيل الصوت عبر MediaRecorder",
        text: `.class public Lcom/lab/tracker/audio/Recorder;
.super Ljava/lang/Object;

.method public start()V
    .registers 2
    new-instance v0, Landroid/media/MediaRecorder;
    invoke-direct {v0}, Landroid/media/MediaRecorder;-><init>()V
    const/4 v1, 0x1
    invoke-virtual {v0, v1}, Landroid/media/MediaRecorder;->setAudioSource(I)V
    return-void
.end method`
      },
      "smali/com/lab/tracker/net/Uploader.smali": {
        type: "smali",
        desc: "إرسال البيانات إلى عنوان خارجي عبر الشبكة",
        text: `.class public Lcom/lab/tracker/net/Uploader;
.super Ljava/lang/Object;

.method public send(Ljava/lang/String;)V
    .registers 3
    const-string v0, "https://example.com/lab-endpoint"
    new-instance v1, Ljava/net/URL;
    invoke-direct {v1, v0}, Ljava/net/URL;-><init>(Ljava/lang/String;)V
    invoke-virtual {v1}, Ljava/net/URL;->openConnection()Ljava/net/URLConnection;
    return-void
.end method`
      },
      "assets/config.json": {
        type: "json",
        desc: "إعدادات المزامنة: الفترة والعنوان ووضع الإخفاء",
        text: `{
  "interval_ms": 60000,
  "endpoint": "https://example.com/lab-endpoint",
  "hidden": true
}`
      },
      "res/layout/activity_main.xml": {
        type: "xml",
        desc: "تصميم شاشة بسيطة",
        text: `<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android">
  <TextView android:text="Welcome" />
</LinearLayout>`
      },
      "resources.arsc": {
        type: "bin",
        desc: "موارد التطبيق المترجمة (ملف ثنائي)",
        text: "(ملف ثنائي مضغوط — لا يُعرض نصياً في هذه المحاكاة)"
      }
    }
  }
};

/* قواعد التحليل: كل قاعدة تطابق سطراً وتعطيه مستوى خطورة وسبباً */
const RULES = [
  { re: /RECORD_AUDIO|MediaRecorder|AudioRecord/, sev: 1, cat: "mic",
    ar: "يتعامل مع الميكروفون أو تسجيل الصوت" },
  { re: /READ_CONTACTS|READ_SMS|ContactsContract|ACCESS_FINE_LOCATION/, sev: 1, cat: "data",
    ar: "يصل إلى بيانات حساسة (جهات الاتصال أو الرسائل أو الموقع)" },
  { re: /android\.permission\.CAMERA/, sev: 1, cat: "cam",
    ar: "يطلب صلاحية الكاميرا" },
  { re: /RECEIVE_BOOT_COMPLETED/, sev: 2, cat: "boot",
    ar: "يسمح ببدء التطبيق تلقائياً بعد إعادة تشغيل الجهاز" },
  { re: /HttpURLConnection|openConnection|java\/net\/Socket|android\.permission\.INTERNET/, sev: 2, cat: "net",
    ar: "يتصل بالشبكة" },
  { re: /extends Landroid\/app\/Service|extends Landroid\/content\/BroadcastReceiver|<service|<receiver/, sev: 2, cat: "bg",
    ar: "خدمة خلفية أو مستقبل أحداث يعمل بدون واجهة" },
  { re: /startSilentRecording|uploadAudioChunk|hideLauncherIcon/, sev: 3, cat: "susp",
    ar: "اسم دالة يوحي بسلوك مخفٍ (تسجيل صامت أو رفع أو إخفاء الأيقونة)" }
];

const SEV_LABELS = [
  "أخضر — ملف عادي",
  "أصفر — صلاحية أو بيانات حساسة",
  "برتقالي — شبكة أو خدمة خلفية",
  "أحمر — سلوك يستوجب التحقيق"
];

const CAT_INFO = {
  mic:  { title: "الميكروفون", why: "الوصول للصوت قدرة حساسة.", tip: "امنح صلاحية الميكروفون فقط عند الحاجة، وراجع الإعدادات بين وقت وآخر." },
  data: { title: "البيانات الشخصية", why: "جهات الاتصال والرسائل والموقع بيانات خاصة.", tip: "ارفض الصلاحية إذا لم تكن الوظيفة تحتاجها فعلاً." },
  cam:  { title: "الكاميرا", why: "الكاميرا قد تُستخدم لالتقاط صور دون علم.", tip: "راجع أذونات الكاميرا وأغلقها للتطبيقات غير الموثوقة." },
  net:  { title: "الاتصال بالشبكة", why: "الاتصال طبيعي للتحديثات، لكنه قناة لإرسال البيانات.", tip: "تحقق من النطاق الذي يتصل به التطبيق ومن حجم البيانات المرسلة." },
  bg:   { title: "الخدمات الخلفية", why: "عمل دون واجهة قد يعني نشاطاً لا تراه.", tip: "راجع التطبيقات التي تعمل في الخلفية من إعدادات البطارية." },
  boot: { title: "التشغيل عند الإقلاع", why: "البدء التلقائي يضمن استمرار التطبيق بعد كل إعادة تشغيل.", tip: "عطّل التشغيل التلقائي للتطبيقات غير الضرورية من إعدادات التطبيق." },
  susp: { title: "سلوك يستوجب التحقيق", why: "أسماء توحي بالتسجيل المخفي أو الرفع أو إخفاء الوجود.", tip: "افحص الكود كاملاً، وتحقق من الإشعارات الظاهرة، وأبلغ عن التطبيق إن ثبت الشك." }
};

const PERMISSIONS = [
  { name: "INTERNET", ar: "الوصول إلى الإنترنت", sens: 1,
    use: "إرسال واستقبال البيانات عبر الشبكة.",
    normal: "المتصفحات والتطبيقات التي تحدّث محتواها أو تحفظ بياناتها سحابياً.",
    suspicious: "عندما يجتمع مع تسجيل الصوت أو قراءة البيانات دون أي إشعار للمستخدم." },
  { name: "RECORD_AUDIO", ar: "تسجيل الصوت", sens: 3,
    use: "الوصول إلى الميكروفون.",
    normal: "تطبيقات المكالمات والتسجيل الصوتي وأوامر الصوت التي يبدؤها المستخدم.",
    suspicious: "عندما يسجل في الخلفية دون واجهة ظاهرة أو دون سبب واضح لوظيفة التطبيق." },
  { name: "CAMERA", ar: "الكاميرا", sens: 3,
    use: "الوصول إلى الكاميرا.",
    normal: "تطبيقات التصوير والمسح الضوئي ومكالمات الفيديو.",
    suspicious: "عندما يلتقط صوراً في الخلفية أو لا توجد شاشة كاميرا تفسّر ذلك." },
  { name: "READ_CONTACTS", ar: "قراءة جهات الاتصال", sens: 2,
    use: "قراءة أسماء وأرقام جهات الاتصال.",
    normal: "تطبيقات المراسلة التي تبحث عن أصدقائك.",
    suspicious: "عندما يطلبها تطبيق بعيد عن التواصل، مثل تطبيق ألعاب أو آلة حاسبة." },
  { name: "ACCESS_FINE_LOCATION", ar: "الموقع الدقيق", sens: 3,
    use: "تحديد الموقع بدقة عبر GPS.",
    normal: "الخرائط والملاحة وتطبيقات التوصيل أثناء استخدامها.",
    suspicious: "عندما يتتبع الموقع في الخلفية دون حاجة وظيفية واضحة." },
  { name: "RECEIVE_BOOT_COMPLETED", ar: "استقبال حدث الإقلاع", sens: 2,
    use: "بدء التطبيق تلقائياً بعد تشغيل الجهاز.",
    normal: "تطبيقات التنبيهات والمنبهات والنسخ الاحتياطي المجدول.",
    suspicious: "عندما يبدأ خدمات مراقبة أو تسجيل بعد كل إقلاع دون أن تطلب ذلك." }
];

const LEVELS = ["مبتدئ", "متدرب", "محلل", "خبير"];

const LESSONS = [
  { id: 1, title: "مقدمة عن ملفات APK",
    body: "ملف APK هو حزمة تطبيق أندرويد، وهو عملياً أرشيف ZIP يحتوي على الكود المترجم والموارد وملف المانيفست. يمكن فتحه كأرشيف لاستعراض محتوياته، لكن الكود داخله مترجم إلى صيغة Dalvik لا تُقرأ بسهولة مباشرة." },
  { id: 2, title: "التعرف على APKTool",
    body: "APKTool أداة تفكّك ملف APK إلى ملفات قابلة للقراءة: ملفات smali، وXML للواجهات والمانيفست، وموارد. استخدمها على تطبيقاتك أو على تطبيقات تملك حق تحليلها." },
  { id: 3, title: "بنية تطبيق Android",
    body: "يتكون التطبيق عادة من المانيفست، ومجلد smali لكود الصنوف، ومجلد res للموارد، ومجلد assets للملفات الإضافية، وملف resources.arsc للموارد المترجمة." },
  { id: 4, title: "قراءة Smali",
    body: "Smali صيغة نصية قريبة من تعليمات Dalvik. تبدأ الصنوف بـ .class وتُعرّف الدوال بـ .method، وتستدعي invoke-virtual دالة، وتقرأ iget وتكتب iput قيم الحقول." },
  { id: 5, title: "AndroidManifest.xml",
    body: "المانيفست يعلن اسم الحزمة والصلاحيات المطلوبة والمكونات مثل Activity وService وReceiver. قراءته أول خطوة في أي تحليل." },
  { id: 6, title: "تحليل الخدمات الخلفية",
    body: "الخدمة Service تعمل في الخلفية دون واجهة، ويستقبل BroadcastReceiver أحداث النظام. وجودهما ليس خطراً بذاته، لكن يستحق النظر إلى ما تفعله." },
  { id: 7, title: "تحليل الصلاحيات",
    body: "كل صلاحية تمنح قدرة: INTERNET للشبكة، وRECORD_AUDIO للميكروفون، وREAD_CONTACTS لجهات الاتصال. اسأل دائماً: هل تحتاج وظيفة التطبيق هذه القدرة فعلاً؟" },
  { id: 8, title: "اكتشاف السلوكيات المشبوهة",
    body: "الشبهة تأتي من اجتماع عدة مؤشرات: وصول لبيانات حساسة مع اتصال شبكي مع تشغيل خلفي أو مخفي. مؤشر واحد لا يكفي لإدانة ملف." },
  { id: 9, title: "تحليل الاتصالات الخارجية",
    body: "الاتصال بالشبكة أمر طبيعي لمعظم التطبيقات. المهم أن تسأل: ما البيانات المرسلة؟ وإلى أي نطاق؟ وهل يعلم المستخدم بذلك؟" },
  { id: 10, title: "تأمين تطبيقات Android",
    body: "راجع الصلاحيات واحذف غير الضرورية، وثبّت التطبيقات من مصادر موثوقة، وراقب استخدام الميكروفون والموقع من إعدادات النظام." }
];

const QUIZ = [
  { id: 1, q: "ما هو ملف APK من الناحية البنيوية؟", opts: ["ملف صورة", "أرشيف ZIP يحتوي على ملفات التطبيق", "ملف نصي فقط", "قاعدة بيانات"], a: 1,
    why: "APK أرشيف ZIP يضم الكود والموارد والمانيفست." },
  { id: 2, q: "ما الذي تفعله أداة APKTool؟", opts: ["تشغيل التطبيق على المحاكي", "تفكيك الـAPK إلى ملفات قابلة للقراءة", "تشفير التطبيق", "رفع التطبيق إلى المتجر"], a: 1,
    why: "تحوّل APKTool الـAPK إلى smali وXML وموارد قابلة للقراءة." },
  { id: 3, q: "ماذا يعني السطر .method في ملف Smali؟", opts: ["تعريف دالة", "متغير عام", "ملف صورة", "اسم الحزمة"], a: 0,
    why: ".method يبدأ تعريف دالة، وينتهي بـ .end method." },
  { id: 4, q: "أين تُعلن الصلاحيات الأساسية في التطبيق؟", opts: ["في AndroidManifest.xml", "في resources.arsc", "في مجلد assets", "في مجلد smali"], a: 0,
    why: "المانيفست هو المكان الرسمي لإعلان الصلاحيات والمكونات." },
  { id: 5, q: "ما الذي يميّز الخدمة الخلفية Service؟", opts: ["تعمل دون واجهة مرئية", "لا تعمل إطلاقاً", "تُستخدم فقط للتصميم", "تعمل فقط عند فتح التطبيق"], a: 0,
    why: "الخدمة تعمل في الخلفية، ووجودها وحده ليس دليلاً على الخطر." },
  { id: 6, q: "أي صلاحية تُعد حساسة جداً؟", opts: ["INTERNET", "RECORD_AUDIO", "VIBRATE", "WAKE_LOCK"], a: 1,
    why: "تسجيل الصوت يمنح التطبيق الوصول إلى الميكروفون." },
  { id: 7, q: "هل كل ملف فيه صلاحية حساسة خبيث؟", opts: ["نعم دائماً", "لا، يجب النظر إلى السياق والسلوك مجتمعاً", "نعم إذا كان مكتوباً بالعربية", "لا توجد صلاحيات خبيثة"], a: 1,
    why: "الصلاحية وحدها لا تكفي، فالحكم يحتاج إلى سياق وسلوك." },
  { id: 8, q: "ما المؤشر الذي يستوجب التحقيق عند اتصال التطبيق بالشبكة؟", opts: ["اتصاله بالشبكة وحده دائماً خبيث", "إرسال بيانات حساسة دون علم المستخدم", "استخدامه لطباعة النص", "وجود ملف صورة"], a: 1,
    why: "الاتصال الطبيعي شائع، أما إرسال بيانات حساسة خفيةً فهو المؤشر المقلق." },
  { id: 9, q: "ماذا تعني صلاحية RECEIVE_BOOT_COMPLETED؟", opts: ["تسمح للتطبيق بالبدء بعد إعادة تشغيل الجهاز", "تحذف التطبيق", "تغيّر الخط", "تعطّل الشبكة"], a: 0,
    why: "تسمح بالتشغيل التلقائي بعد الإقلاع، وهي مفيدة أو مريبة حسب الوظيفة." },
  { id: 10, q: "ما أفضل حماية من التطبيقات المريبة؟", opts: ["تعطيل التحديثات", "مراجعة الصلاحيات وإلغاء غير الضرورية والتثبيت من مصادر موثوقة", "تثبيت أي تطبيق مجاني", "مشاركة كلمات المرور"], a: 1,
    why: "المراجعة الدورية للصلاحيات ومصادر التثبيت أهم خط دفاع." },
  { id: 11, q: "تحدٍّ: في تطبيق LabTracker، أي ملف يجمع بين التشغيل في الخلفية وتسجيل الصوت والإخفاء؟", opts: ["MainActivity.smali", "SyncService.smali", "config.json", "activity_main.xml"], a: 1,
    why: "SyncService يبدأ التسجيل ويخفي الأيقونة، وهذا ما يلفت النظر في العينة." }
];
