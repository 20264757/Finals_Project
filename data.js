/* CareCircle data layer.
   All reads/writes go through window.CC so the storage can later be swapped
   (e.g. for Supabase) by replacing this one file. */
(function () {
  var KEY = 'carecircle:v1', SESSION = 'carecircle:session';
  var M = 60000, H = 3600000, D = 86400000, now = Date.now();
  var memory = null; // fallback if localStorage is blocked

  function seed() {
    var forums = [
      { id: 'lupus', name: 'Lupus', cat: 'Autoimmune', desc: 'Find understanding through flares, fatigue and everyday life.', members: 2480, active: now - 12 * M },
      { id: 'crohns-colitis', name: 'Crohn\u2019s & colitis', cat: 'Digestive health', desc: 'A place for the questions you don\u2019t have to explain.', members: 1920, active: now - 28 * M },
      { id: 'long-covid', name: 'Long COVID', cat: 'Post-viral', desc: 'Share pacing strategies and navigate the unknown together.', members: 3150, active: now - 5 * M },
      { id: 'ms', name: 'Multiple sclerosis', cat: 'Neurological', desc: 'Connect over changing symptoms, care and small wins.', members: 2160, active: now - 42 * M },
      { id: 'rare', name: 'Rare conditions', cat: 'Rare illnesses', desc: 'Your condition may be rare. Your need for connection isn\u2019t.', members: 1340, active: now - H },
      { id: 'chronic', name: 'Living with chronic illness', cat: 'Everyday life', desc: 'Everyday support, whatever your diagnosis looks like.', members: 4820, active: now - 8 * M }
    ];
    var users = {
      'Rowan': { role: 'moderator', label: 'Community team' },
      'Avery Morgan': { role: 'advocate', label: 'Lupus advocate, CareBridge Network' }
    };
    function r(id, author, ago, body, base) { return { id: id, author: author, ts: now - ago, body: body, helpBase: base, helpers: [] }; }
    var threads = [
      { id: 't1', forum: 'lupus', pinned: true, author: 'Rowan', ts: now - 2 * D, title: 'Welcome to the Lupus circle: start here',
        body: 'A few gentle guidelines to help everyone feel safe, heard and supported.\n\nShare experiences, not prescriptions. Protect your own and others\u2019 privacy. Report anything that doesn\u2019t feel safe.',
        tags: ['Community guide'], helpBase: 24, helpers: [], replies: [] },
      { id: 't2', forum: 'lupus', author: 'CedarMoon', ts: now - 12 * M, title: 'How do you explain fatigue to people who can\u2019t see it?',
        body: 'I\u2019m looking for simple ways to describe the difference between tiredness and lupus fatigue. Even after resting, I sometimes don\u2019t have the energy for plans I was looking forward to.\n\nWhen friends say \u201cwe all get tired,\u201d I\u2019m not sure what to say. What words or examples have helped you feel understood?',
        tags: ['Daily life'], helpBase: 24, helpers: [], replies: [
          r('r1', 'QuietFern', 10 * M, 'I say my energy is like a phone battery that starts the day partly charged. Rest helps, but it doesn\u2019t always bring it back to full. It also helps to be specific: \u201cI\u2019d love to see you, but a short visit at home works better today.\u201d', 12),
          r('r2', 'Avery Morgan', 7 * M, 'You don\u2019t have to prove your fatigue for it to be real. Some people find it useful to say: \u201cThis isn\u2019t just feeling sleepy. It affects what my body can do, and rest doesn\u2019t always reset it.\u201d\n\nYou could share one example and one thing that would help, like flexible plans.', 18),
          r('r3', 'Rowan', 4 * M, 'Thank you for making space for each other\u2019s experiences. Please keep suggestions personal rather than medical. If fatigue is new or changing, your care team is the right place to discuss it.', 6)
        ] },
      { id: 't3', forum: 'lupus', author: 'Avery Morgan', ts: now - 38 * M, title: 'What helps you prepare for a rheumatology appointment?',
        body: 'Let\u2019s share the lists, questions and little routines that help us feel more prepared.', tags: ['Appointments'], helpBase: 9, helpers: [], replies: [] },
      { id: 't4', forum: 'lupus', author: 'QuietFern', ts: now - H, title: 'A small win: I made space for rest this weekend',
        body: 'Saying no wasn\u2019t easy, but I\u2019m learning that rest counts as a plan too.', tags: ['Small wins'], helpBase: 14, helpers: [], replies: [] },
      { id: 't5', forum: 'lupus', author: 'MapleSky', ts: now - 2 * H, title: 'Sun-sensitive days: what\u2019s in your everyday bag?',
        body: 'Would love to hear your practical routines for getting out on brighter days.', tags: ['Living with lupus'], helpBase: 5, helpers: [], replies: [] },
      { id: 't6', forum: 'lupus', author: 'RiverLight', ts: now - 3 * H, title: 'New here and taking it one day at a time',
        body: 'Recently diagnosed and mostly reading for now. It\u2019s good to know this space exists.', tags: ['Introductions'], helpBase: 11, helpers: [], replies: [] },
      { id: 't7', forum: 'long-covid', author: 'PaceKeeper', ts: now - 20 * M, title: 'Pacing on a busy week',
        body: 'How do you decide what to drop when your energy dips mid-week?', tags: ['Pacing'], helpBase: 3, helpers: [], replies: [] },
      { id: 't8', forum: 'chronic', author: 'LanternLight', ts: now - 15 * M, title: 'Asking for help without over-explaining',
        body: 'What phrases help you ask for support at work or home?', tags: ['Daily life'], helpBase: 4, helpers: [], replies: [] }
    ];
    return { forums: forums, users: users, threads: threads, reports: [], draft: null, seq: 100 };
  }

  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    return memory || (memory = seed());
  }
  var db = load();
  function save() {
    memory = db;
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }
  save();

  function uid(p) { db.seq += 1; save(); return p + db.seq; }

  var CC = {
    forums: function () { return db.forums; },
    forum: function (id) { return db.forums.filter(function (f) { return f.id === id; })[0]; },
    threads: function (forumId) { return db.threads.filter(function (t) { return !t.hidden && (!forumId || t.forum === forumId); }); },
    thread: function (id) { return db.threads.filter(function (t) { return t.id === id; })[0]; },
    role: function (name) { return (db.users[name] && db.users[name].role) || 'member'; },
    roleLabel: function (name) { return (db.users[name] && db.users[name].label) || ''; },
    helpCount: function (item) { return (item.helpBase || 0) + item.helpers.length; },
    session: function () { try { return localStorage.getItem(SESSION); } catch (e) { return null; } },
    signIn: function (name) { try { localStorage.setItem(SESSION, name); } catch (e) {} },
    signOut: function () { try { localStorage.removeItem(SESSION); } catch (e) {} },
    addThread: function (t) {
      t.id = uid('t'); t.ts = Date.now(); t.helpBase = 0; t.helpers = []; t.replies = [];
      db.threads.unshift(t);
      var f = CC.forum(t.forum); if (f) f.active = t.ts;
      db.draft = null; save(); return t;
    },
    addReply: function (threadId, author, body) {
      var th = CC.thread(threadId);
      var rep = { id: uid('r'), author: author, ts: Date.now(), body: body, helpBase: 0, helpers: [] };
      th.replies.push(rep);
      var f = CC.forum(th.forum); if (f) f.active = rep.ts;
      save(); return rep;
    },
    toggleHelpful: function (threadId, replyId, user) {
      var th = CC.thread(threadId);
      var item = replyId ? th.replies.filter(function (x) { return x.id === replyId; })[0] : th;
      var i = item.helpers.indexOf(user);
      if (i === -1) item.helpers.push(user); else item.helpers.splice(i, 1);
      save(); return item;
    },
    addReport: function (rep) { rep.id = uid('rep'); rep.ts = Date.now(); rep.status = 'open'; db.reports.push(rep); save(); return rep; },
    saveDraft: function (d) { db.draft = d; save(); },
    draft: function () { return db.draft; },
    reset: function () { try { localStorage.removeItem(KEY); localStorage.removeItem(SESSION); } catch (e) {} memory = null; db = seed(); save(); },
    ago: function (ts) {
      var s = Math.max(1, Math.round((Date.now() - ts) / 1000));
      if (s < 60) return 'just now';
      var m = Math.round(s / 60); if (m < 60) return m + ' min ago';
      var h = Math.round(m / 60); if (h < 24) return h + (h === 1 ? ' hr ago' : ' hrs ago');
      var d = Math.round(h / 24); return d + (d === 1 ? ' day ago' : ' days ago');
    },
    esc: function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  };
  window.CC = CC;
})();
