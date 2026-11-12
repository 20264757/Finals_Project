/* Shared header, footer, text-size control, mobile menu, sign-in dialog. */
(function () {
  var esc = CC.esc;
  var page = document.body.getAttribute('data-nav') || '';
  var user = CC.session();
  var links = [['forums.html', 'Forums', 'forums'], ['advocates.html', 'Advocates', 'advocates'], ['resources.html', 'Resources', 'resources'], ['guidelines.html', 'Guidelines', 'guidelines']];

  var logo = '<span class="logo" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></span>';
  var nav = links.map(function (l) { return '<a href="' + l[0] + '"' + (l[2] === page ? ' aria-current="page"' : '') + '>' + l[1] + '</a>'; }).join('');
  var account = user
    ? '<span class="avatar" title="' + esc(user) + '" aria-label="Signed in as ' + esc(user) + '">' + esc(user.slice(0, 2).toUpperCase()) + '</span><button class="btn secondary sm" id="signout" type="button">Sign out</button>'
    : '<a class="btn secondary sm" href="login.html">Log in</a><a class="btn sm" href="signup.html">Sign up</a>';

  var header = '<a class="skip" href="#main">Skip to main content</a><header class="site-header"><div class="wrap bar">' +
    '<a class="brand" href="index.html">' + logo + 'CareCircle</a>' +
    '<button class="btn secondary sm menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button>' +
    '<nav class="nav" id="nav" aria-label="Main">' + nav + '</nav>' +
    '<div class="tools"><button class="btn secondary sm" id="textsize" type="button" aria-pressed="false" aria-label="Larger text"><span aria-hidden="true">A</span><strong aria-hidden="true">A</strong></button>' + account + '</div></div></header>';

  var footer = '<footer class="site-footer"><div class="wrap"><div class="row"><div><a class="brand" href="index.html">' + logo + 'CareCircle</a><p class="small">A little understanding goes a long way.</p></div>' +
    '<nav aria-label="Footer"><a href="guidelines.html">Community guidelines</a><a href="privacy.html">Privacy</a><a href="accessibility.html">Accessibility</a><a href="contact.html">Contact</a></nav></div>' +
    '<hr style="border:0;border-top:1px solid var(--line);margin:1rem 0">' +
    '<p class="small">Peer support, not medical advice. If you need urgent help, contact your local emergency services.</p>' +
    '<p class="small">\u00a9 2026 CareCircle. All names and discussions shown are fictional. <button class="btn secondary sm" id="reset" type="button">Reset demo data</button></p>' +
    '<p class="small">Made by Kenshee Dampilag For Finals Project</p></div></footer>';

  document.body.insertAdjacentHTML('afterbegin', header);
  document.body.insertAdjacentHTML('beforeend', footer);

  // mobile menu
  var mb = document.getElementById('menu-btn'), nv = document.getElementById('nav');
  mb.addEventListener('click', function () { var o = nv.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });

  // text size (remembered)
  var ts = document.getElementById('textsize');
  function setLarge(on) { document.documentElement.classList.toggle('large', on); ts.setAttribute('aria-pressed', on); try { localStorage.setItem('carecircle:large', on ? '1' : '0'); } catch (e) {} }
  var saved = null; try { saved = localStorage.getItem('carecircle:large'); } catch (e) {}
  if (saved === '1') setLarge(true);
  ts.addEventListener('click', function () { setLarge(!document.documentElement.classList.contains('large')); });

  var so = document.getElementById('signout');
  if (so) so.addEventListener('click', function () { CC.signOut(); location.reload(); });
  document.getElementById('reset').addEventListener('click', function () { if (confirm('Reset all demo forum data in this browser?')) { CC.reset(); location.href = 'index.html'; } });

  // toast
  CC.toast = function (msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200);
  };

  // Ask for a username the first time someone posts (simulated account; login pages come later).
  CC.ensureUser = function () {
    return new Promise(function (resolve) {
      var u = CC.session(); if (u) return resolve(u);
      var d = document.createElement('dialog');
      d.setAttribute('aria-labelledby', 'u-title');
      d.innerHTML = '<h2 id="u-title">Choose a username</h2><p class="muted">Use a username, not your real name. This demo keeps it in your browser only.</p>' +
        '<label for="u-name">Username</label><input id="u-name" type="text" maxlength="24" autocomplete="off"><p class="field-error" id="u-err" hidden></p>' +
        '<div class="row" style="justify-content:flex-end;margin-top:1rem"><button class="btn secondary" type="button" id="u-cancel">Cancel</button><button class="btn" type="button" id="u-ok">Continue</button></div>';
      document.body.appendChild(d); d.showModal();
      var inp = d.querySelector('#u-name'), err = d.querySelector('#u-err');
      function done(v) { d.close(); d.remove(); resolve(v); }
      d.querySelector('#u-cancel').onclick = function () { done(null); };
      d.addEventListener('cancel', function () { d.remove(); resolve(null); });
      d.querySelector('#u-ok').onclick = function () {
        var v = inp.value.trim();
        if (!/^[A-Za-z0-9_\-]{3,24}$/.test(v)) { err.hidden = false; err.textContent = 'Use 3 to 24 letters, numbers, hyphens or underscores.'; inp.focus(); return; }
        if (CC.role(v) !== 'member') { err.hidden = false; err.textContent = 'That username is reserved. Please choose another.'; inp.focus(); return; }
        CC.signIn(v); done(v);
      };
      inp.focus();
    });
  };
})();
