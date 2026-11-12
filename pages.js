/* Page logic: forums directory, forum thread list, thread view, create post. */
(function () {
  var esc = CC.esc, page = document.body.getAttribute('data-page');
  var q = new URLSearchParams(location.search);
  function $(s, r) { return (r || document).querySelector(s); }
  function initials(n) { return esc(n.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '?'); }
  function badge(name) {
    var r = CC.role(name);
    return r === 'advocate' ? '<span class="badge advocate">Patient advocate</span>' : r === 'moderator' ? '<span class="badge moderator">Moderator</span>' : '';
  }
  function who(t) { return t.anon ? 'Anonymous member' : t.author; }

  /* ---------- Forums directory ---------- */
  if (page === 'forums') {
    var cat = 'All communities', term = '';
    var cats = ['All communities'].concat(CC.forums().map(function (f) { return f.cat; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
    var chips = $('#chips'), grid = $('#grid'), count = $('#count');
    function draw() {
      chips.innerHTML = cats.map(function (c) { return '<button type="button" class="chip" aria-pressed="' + (c === cat) + '">' + esc(c) + '</button>'; }).join('');
      var list = CC.forums().filter(function (f) {
        return (cat === 'All communities' || f.cat === cat) && (f.name + ' ' + f.desc + ' ' + f.cat).toLowerCase().indexOf(term) !== -1;
      }).sort(function (a, b) { return b.active - a.active; });
      count.textContent = list.length + (list.length === 1 ? ' community' : ' communities');
      grid.innerHTML = list.length ? list.map(function (f) {
        return '<a class="card community-card" href="forum.html?id=' + esc(f.id) + '"><span class="icon-tile" aria-hidden="true">' + esc(f.name[0]) + '</span>' +
          '<h3>' + esc(f.name) + '</h3><p class="muted">' + esc(f.desc) + '</p><span class="chip">' + esc(f.cat) + '</span>' +
          '<p style="margin:.75rem 0 0"><strong>' + f.members.toLocaleString() + ' members</strong><br><span class="small">Active ' + CC.ago(f.active) + '</span></p></a>';
      }).join('') : '<p class="empty">No communities match. Try a different word or choose All communities.</p>';
    }
    chips.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { cat = b.textContent; draw(); } });
    $('#search').addEventListener('input', function (e) { term = e.target.value.trim().toLowerCase(); draw(); });
    draw();
  }

  /* ---------- Forum (thread list) ---------- */
  if (page === 'forum') {
    var f = CC.forum(q.get('id'));
    if (!f) { $('#main').innerHTML = '<div class="wrap section"><h1>Community not found</h1><p><a href="forums.html">Back to all communities</a></p></div>'; return; }
    document.title = f.name + ' forum \u2013 CareCircle';
    $('#crumb').innerHTML = '<a href="forums.html">Forums</a> / ' + esc(f.cat) + ' / ' + esc(f.name);
    $('#fname').textContent = f.name;
    $('#fdesc').textContent = f.desc;
    $('#fmeta').textContent = f.members.toLocaleString() + ' members \u00b7 Moderated community';
    $('#newpost').href = 'new-post.html?forum=' + encodeURIComponent(f.id);
    var tab = 'latest', list = $('#threads');
    function item(t) {
      var pin = t.pinned ? '<p class="small" style="margin:0 0 .5rem"><strong>Pinned by moderators</strong></p>' : '';
      return '<article class="card' + (t.pinned ? ' pinned' : '') + '">' + pin +
        '<div class="meta"><span class="avatar">' + initials(who(t)) + '</span><div><strong>' + esc(who(t)) + '</strong> ' + (t.anon ? '' : badge(t.author)) + '<br>' + CC.ago(t.ts) + '</div></div>' +
        '<a class="thread-link" href="thread.html?id=' + esc(t.id) + '"><h3>' + esc(t.title) + '</h3><p class="muted" style="margin:0">' + esc(t.body.split('\n')[0].slice(0, 140)) + '</p></a>' +
        '<div class="thread-foot"><span>' + t.tags.map(function (x) { return '<span class="chip">' + esc(x) + '</span> '; }).join('') + '</span><span class="small">' + t.replies.length + (t.replies.length === 1 ? ' reply' : ' replies') + '</span></div></article>';
    }
    function drawThreads() {
      var ts = CC.threads(f.id).slice();
      if (tab === 'popular') ts.sort(function (a, b) { return (CC.helpCount(b) + b.replies.length) - (CC.helpCount(a) + a.replies.length); });
      else if (tab === 'unanswered') ts = ts.filter(function (t) { return !t.replies.length && !t.pinned; });
      if (tab !== 'popular') ts.sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.ts - a.ts; });
      $('#tcount').textContent = ts.length + (ts.length === 1 ? ' conversation' : ' conversations');
      list.innerHTML = ts.length ? ts.map(item).join('') : '<p class="empty">Nothing here yet. Be the first to <a href="new-post.html?forum=' + esc(f.id) + '">start a conversation</a>.</p>';
    }
    $('#tabs').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; tab = b.dataset.tab;
      [].forEach.call($('#tabs').children, function (x) { x.setAttribute('aria-selected', x === b); });
      drawThreads();
    });
    drawThreads();
  }

  /* ---------- Thread view ---------- */
  if (page === 'thread') {
    var th = CC.thread(q.get('id'));
    if (!th || th.hidden) { $('#main').innerHTML = '<div class="wrap section"><h1>Conversation not found</h1><p><a href="forums.html">Back to all communities</a></p></div>'; return; }
    var fo = CC.forum(th.forum);
    document.title = th.title + ' \u2013 CareCircle';
    $('#crumb').innerHTML = '<a href="forums.html">Forums</a> / <a href="forum.html?id=' + esc(fo.id) + '">' + esc(fo.name) + '</a> / Discussion';
    $('#ttitle').textContent = th.title;
    $('#ttags').innerHTML = '<span class="chip">' + esc(fo.name) + '</span> ' + th.tags.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join(' ');
    $('#back').href = 'forum.html?id=' + fo.id; $('#fside').textContent = fo.name;
    $('#fsideinfo').textContent = fo.desc;
    $('#related').innerHTML = CC.threads(fo.id).filter(function (t) { return t.id !== th.id; }).slice(0, 3).map(function (t) {
      return '<a class="card thread-link" href="thread.html?id=' + esc(t.id) + '"><strong>' + esc(t.title) + '</strong><br><span class="small">' + t.replies.length + ' replies</span></a>';
    }).join('') || '<p class="small">No related threads yet.</p>';

    function postCard(item, isOriginal) {
      var name = isOriginal ? who(item) : item.author, mine = CC.session(), on = mine && item.helpers.indexOf(mine) !== -1;
      var role = (!isOriginal || !item.anon) ? badge(isOriginal ? item.author : item.author) : '';
      var lab = CC.roleLabel(name);
      return '<article class="card" id="' + esc(item.id) + '"><div class="meta"><span class="avatar' + (CC.role(name) === 'advocate' ? ' coral' : '') + '">' + initials(name) + '</span>' +
        '<div><strong>' + esc(name) + '</strong> ' + role + '<br>' + CC.ago(item.ts) + (isOriginal ? ' \u00b7 Original post' : '') + (lab ? ' \u00b7 ' + esc(lab) : '') + '</div></div>' +
        (isOriginal && item.warning ? '<p class="banner" style="margin-top:1rem"><strong>Trigger warning:</strong> this post may include distressing content.</p>' : '') +
        '<p class="post-body" style="margin-top:1rem">' + esc(item.body) + '</p>' +
        '<div class="actions"><button class="btn secondary sm helpful' + (on ? ' on' : '') + '" type="button" aria-pressed="' + !!on + '" data-id="' + (isOriginal ? '' : esc(item.id)) + '">Helpful \u00b7 ' + CC.helpCount(item) + '</button>' +
        '<button class="btn secondary sm report" type="button" data-id="' + esc(item.id) + '">Report</button></div></article>';
    }
    function drawPosts() {
      $('#original').innerHTML = postCard(th, true);
      $('#rcount').textContent = th.replies.length + (th.replies.length === 1 ? ' reply' : ' replies');
      $('#replies').innerHTML = th.replies.map(function (r) { return postCard(r, false); }).join('');
      $('#tmeta').textContent = 'Started by ' + who(th) + ' \u00b7 ' + CC.ago(th.ts) + ' \u00b7 ' + th.replies.length + ' replies';
    }
    drawPosts();

    document.addEventListener('click', function (e) {
      var h = e.target.closest('.helpful'), rp = e.target.closest('.report');
      if (h) { CC.ensureUser().then(function (u) { if (!u) return; CC.toggleHelpful(th.id, h.dataset.id || null, u); location.reload(); }); }
      if (rp) { openReport(rp.dataset.id); }
    });

    // reply
    var rf = $('#replyform'), rt = $('#replytext'), re = $('#replyerr');
    rf.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = rt.value.trim();
      if (v.length < 2) { re.hidden = false; re.textContent = 'Write a few words before posting your reply.'; rt.focus(); return; }
      re.hidden = true;
      CC.ensureUser().then(function (u) { if (!u) return; CC.addReply(th.id, u, v); rt.value = ''; location.hash = ''; location.reload(); });
    });

    // report
    var dlg = $('#reportdlg'), rid = null;
    function openReport(id) { rid = id; $('#rstep1').hidden = false; $('#rstep2').hidden = true; $('#rerr').hidden = true; $('#reason').value = ''; $('#rdetail').value = ''; dlg.showModal(); $('#reason').focus(); }
    $('#rcancel').onclick = function () { dlg.close(); };
    $('#rclose').onclick = function () { dlg.close(); };
    $('#rsend').onclick = function () {
      if (!$('#reason').value) { $('#rerr').hidden = false; $('#rerr').textContent = 'Choose a reason so moderators know what to look for.'; $('#reason').focus(); return; }
      CC.addReport({ thread: th.id, item: rid, reason: $('#reason').value, detail: $('#rdetail').value.trim(), reporter: CC.session() || 'guest' });
      $('#rstep1').hidden = true; $('#rstep2').hidden = false; $('#rback').focus();
    };
    $('#rback').onclick = function () { dlg.close(); };
  }

  /* ---------- Create post ---------- */
  if (page === 'new-post') {
    var sel = $('#forum'), tags = [], draft = CC.draft();
    sel.innerHTML = CC.forums().map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.name) + '</option>'; }).join('');
    var pre = q.get('forum') || (draft && draft.forum); if (pre && CC.forum(pre)) sel.value = pre;
    if (draft) { $('#title').value = draft.title || ''; $('#body').value = draft.body || ''; tags = draft.tags || []; $('#warn').checked = !!draft.warning; $('#anon').checked = !!draft.anon; }
    function drawTags() {
      $('#taglist').innerHTML = tags.map(function (t, i) { return '<button type="button" class="tag-chip" data-i="' + i + '" aria-label="Remove tag ' + esc(t) + '">' + esc(t) + ' \u00d7</button>'; }).join('');
      $('#addtag').disabled = tags.length >= 3;
    }
    function wc() { var n = $('#body').value.trim().split(/\s+/).filter(Boolean).length; $('#wc').textContent = n + (n === 1 ? ' word' : ' words'); }
    drawTags(); wc(); $('#body').addEventListener('input', wc);
    $('#back').href = 'forum.html?id=' + sel.value; sel.addEventListener('change', function () { $('#back').href = 'forum.html?id=' + sel.value; });
    $('#taglist').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { tags.splice(+b.dataset.i, 1); drawTags(); } });
    function addTag() {
      var inp = $('#taginput'), v = inp.value.trim().slice(0, 24);
      if (v && tags.length < 3 && tags.indexOf(v) === -1) { tags.push(v); drawTags(); }
      inp.value = ''; inp.focus();
    }
    $('#addtag').addEventListener('click', addTag);
    $('#taginput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addTag(); } });
    function current() { return { forum: sel.value, title: $('#title').value.trim(), body: $('#body').value.trim(), tags: tags.slice(), warning: $('#warn').checked, anon: $('#anon').checked }; }
    $('#savedraft').addEventListener('click', function () { CC.saveDraft(current()); CC.toast('Draft saved on this device.'); });
    $('#postform').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = current(), ok = true;
      $('#terr').hidden = d.title.length >= 5; $('#berr').hidden = d.body.length >= 10;
      if (d.title.length < 5) { $('#terr').textContent = 'Add a title of at least 5 characters.'; ok = false; }
      if (d.body.length < 10) { $('#berr').textContent = 'Write at least a sentence so people can respond.'; ok = false; }
      if (!ok) { ($('#terr').hidden ? $('#body') : $('#title')).focus(); return; }
      CC.ensureUser().then(function (u) {
        if (!u) return; d.author = u; var t = CC.addThread(d); location.href = 'thread.html?id=' + t.id;
      });
    });
  }
})();
