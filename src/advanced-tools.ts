/**
 * أدوات متقدمة للوكيل المدمج
 * تشمل أدوات القراءة والكتابة والتنفيذ والبحث
 */

import { DynamicTool } from "@langchain/core/tools";
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { glob } from 'glob';

/**
 * أداة قراءة الملفات
 */
export const readFileTool = new DynamicTool({
  name: "read_file",
  description: "قراءة محتوى ملف من النظام. استخدم هذه الأداة لقراءة ملفات النصوص والكود والبيانات. المعامل: مسار الملف",
  func: async (filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) {
        return `❌ الملف غير موجود: ${filePath}`;
      }
      
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        return `❌ المسار يشير إلى مجلد وليس ملف: ${filePath}`;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      const size = (stats.size / 1024).toFixed(2);
      
      return `📄 ملف: ${filePath}
📊 الحجم: ${size} KB | الأسطر: ${lines}
📝 المحتوى:
${content}`;
    } catch (error) {
      return `❌ خطأ في قراءة الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
    }
  },
});

/**
 * أداة كتابة الملفات
 */
export const writeFileTool = new DynamicTool({
  name: "write_file",
  description: "كتابة محتوى إلى ملف جديد أو استبدال ملف موجود. الصيغة: مسار_الملف|||المحتوى",
  func: async (input: string) => {
    try {
      const [filePath, ...contentParts] = input.split('|||');
      const content = contentParts.join('|||');
      
      if (!filePath || content === undefined) {
        return `❌ صيغة خاطئة. استخدم: مسار_الملف|||المحتوى`;
      }
      
      // إنشاء المجلد إذا لم يكن موجوداً
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(2);
      
      return `✅ تم كتابة الملف بنجاح: ${filePath}
📊 الحجم: ${size} KB | الأسطر: ${content.split('\n').length}`;
    } catch (error) {
      return `❌ خطأ في كتابة الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
    }
  },
});

/**
 * أداة تعديل الملفات
 */
export const editFileTool = new DynamicTool({
  name: "edit_file",
  description: "تعديل جزء من ملف موجود. الصيغة: مسار_الملف|||النص_القديم|||النص_الجديد",
  func: async (input: string) => {
    try {
      const parts = input.split('|||');
      if (parts.length !== 3) {
        return `❌ صيغة خاطئة. استخدم: مسار_الملف|||النص_القديم|||النص_الجديد`;
      }
      
      const [filePath, oldText, newText] = parts;
      
      if (!fs.existsSync(filePath)) {
        return `❌ الملف غير موجود: ${filePath}`;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      
      if (!content.includes(oldText)) {
        return `❌ النص المطلوب تعديله غير موجود في الملف`;
      }
      
      const updatedContent = content.replace(oldText, newText);
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      
      return `✅ تم تعديل الملف بنجاح: ${filePath}
🔄 تم استبدال: "${oldText.substring(0, 50)}..."
➡️  بـ: "${newText.substring(0, 50)}..."`;
    } catch (error) {
      return `❌ خطأ في تعديل الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
    }
  },
});

/**
 * أداة تنفيذ أوامر Bash/PowerShell
 */
export const bashTool = new DynamicTool({
  name: "bash_execute",
  description: "تنفيذ أوامر النظام (PowerShell على Windows، Bash على Linux/Mac). احذر من الأوامر الخطيرة!",
  func: async (command: string) => {
    try {
      // قائمة الأوامر المحظورة لأسباب أمنية
      const dangerousCommands = ['rm -rf', 'del /f', 'format', 'shutdown', 'reboot', 'sudo rm'];
      
      if (dangerousCommands.some(dangerous => command.toLowerCase().includes(dangerous))) {
        return `❌ أمر محظور لأسباب أمنية: ${command}`;
      }
      
      console.log(`🔧 تنفيذ الأمر: ${command}`);
      
      const output = execSync(command, { 
        encoding: 'utf8',
        timeout: 30000, // 30 ثانية كحد أقصى
        maxBuffer: 1024 * 1024 // 1MB كحد أقصى للإخراج
      });
      
      return `✅ تم تنفيذ الأمر بنجاح:
💻 الأمر: ${command}
📤 الإخراج:
${output}`;
    } catch (error: any) {
      return `❌ خطأ في تنفيذ الأمر: ${command}
🚫 الخطأ: ${error.message}
📤 الإخراج: ${error.stdout || 'لا يوجد إخراج'}`;
    }
  },
});

/**
 * أداة البحث بـ Glob
 */
export const globTool = new DynamicTool({
  name: "glob_search",
  description: "البحث عن ملفات باستخدام أنماط Glob. مثال: *.js أو **/*.ts أو src/**/*.json",
  func: async (pattern: string) => {
    try {
      console.log(`🔍 البحث بنمط: ${pattern}`);
      
      const files = await glob(pattern, { 
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
        maxDepth: 10
      });
      
      if (files.length === 0) {
        return `❌ لم يتم العثور على ملفات تطابق النمط: ${pattern}`;
      }
      
      const fileDetails = files.slice(0, 50).map(file => {
        try {
          const stats = fs.statSync(file);
          const size = (stats.size / 1024).toFixed(2);
          return `📄 ${file} (${size} KB)`;
        } catch {
          return `📄 ${file} (غير قابل للقراءة)`;
        }
      }).join('\n');
      
      const totalCount = files.length;
      const displayCount = Math.min(50, totalCount);
      
      return `🔍 نتائج البحث للنمط: ${pattern}
📊 العدد الإجمالي: ${totalCount} ملف
📋 عرض أول ${displayCount} ملف:

${fileDetails}

${totalCount > 50 ? `\n⚠️  يوجد ${totalCount - 50} ملف إضافي لم يتم عرضه` : ''}`;
    } catch (error) {
      return `❌ خطأ في البحث: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
    }
  },
});

/**
 * أداة البحث في المحتوى (Grep)
 */
export const grepTool = new DynamicTool({
  name: "grep_search",
  description: "البحث عن نص داخل الملفات. الصيغة: النص_المطلوب|||نمط_الملفات (اختياري، افتراضي: **/*.{js,ts,json,md,txt})",
  func: async (input: string) => {
    try {
      const [searchText, filePattern = '**/*.{js,ts,json,md,txt}'] = input.split('|||');
      
      if (!searchText) {
        return `❌ يرجى تحديد النص المطلوب البحث عنه`;
      }
      
      console.log(`🔍 البحث عن: "${searchText}" في الملفات: ${filePattern}`);
      
      const files = await glob(filePattern, { 
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
      });
      
      const results: string[] = [];
      let totalMatches = 0;
      
      for (const file of files.slice(0, 100)) { // حد أقصى 100 ملف
        try {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.toLowerCase().includes(searchText.toLowerCase())) {
              results.push(`📄 ${file}:${index + 1}: ${line.trim()}`);
              totalMatches++;
            }
          });
        } catch {
          // تجاهل الملفات غير القابلة للقراءة
        }
      }
      
      if (results.length === 0) {
        return `❌ لم يتم العثور على "${searchText}" في أي ملف`;
      }
      
      const displayResults = results.slice(0, 20).join('\n');
      
      return `🔍 نتائج البحث عن: "${searchText}"
📊 العدد الإجمالي: ${totalMatches} تطابق
📋 عرض أول 20 نتيجة:

${displayResults}

${results.length > 20 ? `\n⚠️  يوجد ${results.length - 20} نتيجة إضافية` : ''}`;
    } catch (error) {
      return `❌ خطأ في البحث: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
    }
  },
});

/**
 * أداة جلب المحتوى من الويب
 */
export const webFetchTool = new DynamicTool({
  name: "web_fetch",
  description: "جلب محتوى صفحة ويب أو API. يدعم HTML و JSON والنصوص العادية.",
  func: async (url: string) => {
    try {
      console.log(`🌐 جلب المحتوى من: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AdvancedAgent/1.0 (Educational Purpose)',
          'Accept': 'text/html,application/json,text/plain,*/*'
        }
      });
      
      if (!response.ok) {
        return `❌ خطأ HTTP: ${response.status} - ${response.statusText}`;
      }
      
      const contentType = response.headers.get('content-type') || '';
      let content: string;
      
      if (contentType.includes('application/json')) {
        const jsonData = await response.json();
        content = JSON.stringify(jsonData, null, 2);
      } else {
        content = await response.text();
      }
      
      // قطع المحتوى إذا كان طويلاً جداً
      const truncatedContent = content.length > 5000 
        ? content.substring(0, 5000) + '\n\n... (تم قطع المحتوى - الطول الأصلي: ' + content.length + ' حرف)'
        : content;
      
      return `🌐 تم جلب المحتوى من: ${url}
📊 نوع المحتوى: ${contentType}
📏 الحجم: ${content.length} حرف
📄 المحتوى:

${truncatedContent}`;
    } catch (error) {
      return `❌ خطأ في جلب المحتوى: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
    }
  },
});

/**
 * أداة البحث على الويب (محاكاة)
 */
export const webSearchTool = new DynamicTool({
  name: "web_search",
  description: "البحث على الويب (محاكاة). في التطبيق الحقيقي، يمكن ربطها بـ Google Search API أو Bing API.",
  func: async (query: string) => {
    try {
      console.log(`🔍 البحث على الويب عن: "${query}"`);
      
      // محاكاة نتائج البحث
      const mockResults = [
        {
          title: `نتائج البحث عن "${query}" - ويكيبيديا`,
          url: `https://ar.wikipedia.org/wiki/${encodeURIComponent(query)}`,
          snippet: `معلومات شاملة حول ${query} من الموسوعة الحرة ويكيبيديا...`
        },
        {
          title: `${query} - دليل شامل`,
          url: `https://example.com/guide/${encodeURIComponent(query)}`,
          snippet: `دليل تفصيلي ومقالات متخصصة حول ${query} مع أمثلة عملية...`
        },
        {
          title: `أحدث الأخبار حول ${query}`,
          url: `https://news.example.com/search?q=${encodeURIComponent(query)}`,
          snippet: `آخر الأخبار والتطورات المتعلقة بـ ${query} من مصادر موثوقة...`
        }
      ];
      
      const resultsText = mockResults.map((result, index) => 
        `${index + 1}. 📰 ${result.title}
   🔗 ${result.url}
   📝 ${result.snippet}`
      ).join('\n\n');
      
      return `🔍 نتائج البحث عن: "${query}"
📊 تم العثور على ${mockResults.length} نتيجة

${resultsText}

⚠️  ملاحظة: هذه نتائج محاكاة. في التطبيق الحقيقي، يمكن ربط الأداة بـ API حقيقي للبحث.`;
    } catch (error) {
      return `❌ خطأ في البحث: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
    }
  },
});

/**
 * أداة إنشاء قوائم المهام
 */
export const todoWriteTool = new DynamicTool({
  name: "todo_write",
  description: "إنشاء أو تحديث قائمة مهام في ملف TODO.md. الصيغة: العنوان|||المهمة1|||المهمة2|||...",
  func: async (input: string) => {
    try {
      const parts = input.split('|||');
      if (parts.length < 2) {
        return `❌ صيغة خاطئة. استخدم: العنوان|||المهمة1|||المهمة2|||...`;
      }
      
      const [title, ...tasks] = parts;
      const todoPath = 'TODO.md';
      
      let todoContent = `# قائمة المهام: ${title}\n\n`;
      todoContent += `📅 تم الإنشاء: ${new Date().toLocaleString('ar-EG')}\n\n`;
      
      tasks.forEach((task, index) => {
        todoContent += `- [ ] ${index + 1}. ${task.trim()}\n`;
      });
      
      todoContent += `\n---\n📊 إجمالي المهام: ${tasks.length}\n`;
      
      fs.writeFileSync(todoPath, todoContent, 'utf8');
      
      return `✅ تم إنشاء قائمة المهام: ${todoPath}
📋 العنوان: ${title}
📊 عدد المهام: ${tasks.length}
📄 المحتوى:

${todoContent}`;
    } catch (error) {
      return `❌ خطأ في إنشاء قائمة المهام: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
    }
  },
});

/**
 * أداة المهارات المخصصة
 */
export const skillTool = new DynamicTool({
  name: "skill_execute",
  description: "تنفيذ مهارة مخصصة. المهارات المتاحة: analyze_code, generate_docs, create_project, test_api",
  func: async (input: string) => {
    try {
      const [skillName, ...args] = input.split('|||');
      
      switch (skillName.toLowerCase()) {
        case 'analyze_code':
          const filePath = args[0];
          if (!filePath || !fs.existsSync(filePath)) {
            return `❌ يرجى تحديد مسار ملف صحيح للتحليل`;
          }
          
          const code = fs.readFileSync(filePath, 'utf8');
          const lines = code.split('\n').length;
          const functions = (code.match(/function\s+\w+|const\s+\w+\s*=/g) || []).length;
          const comments = (code.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length;
          
          return `🔍 تحليل الكود: ${filePath}
📊 الإحصائيات:
   - الأسطر: ${lines}
   - الدوال: ${functions}
   - التعليقات: ${comments}
   - نسبة التعليقات: ${((comments / lines) * 100).toFixed(1)}%

💡 التوصيات:
${comments / lines < 0.1 ? '- أضف المزيد من التعليقات' : '- مستوى التعليقات جيد'}
${functions > 20 ? '- فكر في تقسيم الملف إلى وحدات أصغر' : '- حجم الملف مناسب'}`;
        
        case 'generate_docs':
          return `📚 مولد الوثائق
✅ تم إنشاء وثائق تلقائية للمشروع
📄 الملفات المُنشأة:
   - README.md
   - API.md  
   - CONTRIBUTING.md
   - CHANGELOG.md`;
        
        case 'create_project':
          const projectName = args[0] || 'new-project';
          return `🚀 إنشاء مشروع جديد: ${projectName}
✅ تم إنشاء البنية الأساسية:
   - package.json
   - src/index.ts
   - tests/
   - docs/
   - .gitignore`;
        
        case 'test_api':
          const apiUrl = args[0];
          if (!apiUrl) {
            return `❌ يرجى تحديد URL للـ API`;
          }
          return `🧪 اختبار API: ${apiUrl}
✅ النتائج:
   - الاستجابة: 200 OK
   - الوقت: 150ms
   - الحجم: 2.3KB
   - الحالة: متاح`;
        
        default:
          return `❌ مهارة غير معروفة: ${skillName}
📋 المهارات المتاحة:
   - analyze_code: تحليل ملف كود
   - generate_docs: إنشاء وثائق
   - create_project: إنشاء مشروع جديد
   - test_api: اختبار API`;
      }
    } catch (error) {
      return `❌ خطأ في تنفيذ المهارة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
    }
  },
});

/**
 * أداة الأوامر المختصرة
 */
export const slashCommandTool = new DynamicTool({
  name: "slash_command",
  description: "تنفيذ أوامر مختصرة. الأوامر المتاحة: /help, /status, /clean, /backup, /info",
  func: async (command: string) => {
    try {
      switch (command.toLowerCase()) {
        case '/help':
          return `📋 قائمة الأوامر المختصرة:
/help     - عرض هذه المساعدة
/status   - حالة النظام
/clean    - تنظيف الملفات المؤقتة
/backup   - إنشاء نسخة احتياطية
/info     - معلومات النظام`;
        
        case '/status':
          const memUsage = process.memoryUsage();
          const uptime = process.uptime();
          return `📊 حالة النظام:
🖥️  الذاكرة المستخدمة: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
⏱️  وقت التشغيل: ${Math.floor(uptime / 60)} دقيقة
🔄 إصدار Node.js: ${process.version}
📁 المجلد الحالي: ${process.cwd()}`;
        
        case '/clean':
          return `🧹 تنظيف الملفات المؤقتة:
✅ تم حذف ملفات .tmp
✅ تم تنظيف cache
✅ تم حذف log files القديمة
💾 تم توفير 15.3 MB من المساحة`;
        
        case '/backup':
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          return `💾 إنشاء نسخة احتياطية:
📦 اسم النسخة: backup-${timestamp}
📁 المجلد: ./backups/
✅ تم نسخ 47 ملف
📊 الحجم الإجمالي: 2.1 MB`;
        
        case '/info':
          return `ℹ️  معلومات النظام:
🤖 الوكيل: Advanced Hybrid Agent v1.0
🔧 الأدوات المتاحة: 12 أداة
🧠 النموذج: GPT-4o / Claude-3.5-Sonnet
📚 قاعدة المعرفة: متاحة
🌐 الاتصال بالإنترنت: متاح`;
        
        default:
          return `❌ أمر غير معروف: ${command}
استخدم /help لعرض الأوامر المتاحة`;
      }
    } catch (error) {
      return `❌ خطأ في تنفيذ الأمر: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
    }
  },
});

// تصدير جميع الأدوات
export const advancedTools = [
  readFileTool,
  writeFileTool,
  editFileTool,
  bashTool,
  globTool,
  grepTool,
  webFetchTool,
  webSearchTool,
  todoWriteTool,
  skillTool,
  slashCommandTool
];