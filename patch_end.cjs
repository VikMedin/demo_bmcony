const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /                      <\/div>\n                    \)}\n\n                    \{adminTab === 'perfil' && profile && \(/,
  `                        </div>\n                      </div>\n                    )}\n                  </div>\n                )}\n\n                {adminTab === 'perfil' && profile && (`
);

fs.writeFileSync('src/App.tsx', code);
