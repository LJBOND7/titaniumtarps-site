# Roof-cover verification

Run `node --test qa/cover-integrated.test.cjs` from the repository root. The 18 tests use the shipped Three.js geometry with a mocked DOM and renderer; they do not replace browser testing.

The suite checks the approved geometry hash, forward and reverse cover transitions, flat overhead positioning, conforming/secured geometry, rain/leak state, reversible explosion, bounded horizontal rotation, mobile pointer-capture transfer, reduced motion, visibility suspension, camera bounds, and fallback failures.

Chrome verification on 2026-10-15 covered Larry, Spiro, Chris, Marcelo, Yessenia and the homepage at widths 320, 390, 768 and 1440. Each page passed stages 0/45/66/100 and reverse, explode/reassemble, turn/reset, rain controls, unique layout regions and overflow checks. Card and homepage touch tests confirmed continuous horizontal rotation and vertical page scrolling without tilt. Native RTL range keys, reduced motion, WebGL failure/context loss, card contact/QR dialogs and the 90.8-second film were also checked.

The existing contact details, QR/vCard assets, shared non-model card behavior, full field film and original homepage sections were compared with the pre-integration local baseline and preserved.
