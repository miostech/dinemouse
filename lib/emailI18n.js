/**
 * Traduções PT/EN dos e-mails e do WhatsApp (lado servidor). Usado pelo site
 * (api/lib) e pelo worker (../../lib). t(lang, key, ...args) -> string.
 */
const STR = {
    // --- E-mail de compra ---
    purchase_subject_alerts: { pt: 'Seus alertas Dine Mouse estão ativos ✅', en: 'Your Dine Mouse alerts are active ✅' },
    purchase_subject_generic: { pt: 'Compra confirmada — Dine Mouse', en: 'Purchase confirmed — Dine Mouse' },
    purchase_title: { pt: '🎉 Compra confirmada', en: '🎉 Purchase confirmed' },
    hello: { pt: 'Olá', en: 'Hi' },
    intro_alerts: {
        pt: 'Seu pagamento foi confirmado e os alertas abaixo já estão <strong>ativos</strong> — vamos monitorar 24/7 e avisar assim que surgir disponibilidade:',
        en: 'Your payment is confirmed and the alerts below are now <strong>active</strong> — we\'ll monitor 24/7 and notify you as soon as availability appears:',
    },
    intro_generic: { pt: 'Seu pagamento foi confirmado! 🎉', en: 'Your payment is confirmed! 🎉' },
    people: { pt: 'pessoa(s)', en: 'people' },
    plan_label: { pt: 'Plano', en: 'Plan' },
    email_label: { pt: 'E-mail', en: 'Email' },
    temp_password: { pt: 'Senha temporária', en: 'Temporary password' },
    change_pw_hint: { pt: 'Recomendamos alterar sua senha no primeiro acesso.', en: 'We recommend changing your password on first login.' },
    access_portal: { pt: 'Acessar o Portal', en: 'Access the Portal' },

    // --- E-mail de vaga encontrada ---
    avail_subject: {
        pt: (r, d) => `Vaga disponível: ${r} em ${d}`,
        en: (r, d) => `Table available: ${r} on ${d}`,
    },
    avail_title: { pt: '🎉 Vaga encontrada!', en: '🎉 Table found!' },
    avail_intro: {
        pt: 'Surgiu disponibilidade em um restaurante que você está monitorando.',
        en: 'Availability just opened at a restaurant you\'re monitoring.',
    },
    restaurant_label: { pt: 'Restaurante', en: 'Restaurant' },
    date_label: { pt: 'Data', en: 'Date' },
    meal_label: { pt: 'Refeição', en: 'Meal' },
    people_label: { pt: 'Pessoas', en: 'People' },
    times_now: { pt: 'Horários disponíveis agora:', en: 'Times available now:' },
    reserve_btn: { pt: 'Reservar na Disney', en: 'Book on Disney' },
    reserve_word: { pt: 'Reservar', en: 'Book' },
    hurry: {
        pt: '⚠️ Essas vagas somem rápido. Reserve o quanto antes no site oficial da Disney.',
        en: '⚠️ These slots disappear fast. Book as soon as possible on Disney\'s official site.',
    },
    manage_prefix: { pt: 'Gerencie seus alertas no', en: 'Manage your alerts in the' },
    portal_name: { pt: 'Portal Dine Mouse', en: 'Dine Mouse Portal' },
};

function t(lang, key, ...args) {
    const entry = STR[key];
    if (!entry) return key;
    const val = entry[lang === 'en' ? 'en' : 'pt'];
    return typeof val === 'function' ? val(...args) : val;
}

/** Traduz o nome do plano (armazenado em PT) para EN. */
function planName(lang, name) {
    if (lang !== 'en' || !name) return name || '';
    return String(name)
        .replace('Plano Individual — Alertas', 'Individual Plan — Alerts')
        .replace(/Assinatura Mensal — (\d+) alertas/, 'Monthly Subscription — $1 alerts')
        .replace('Assinatura Mensal — Alertas', 'Monthly Subscription — Alerts')
        .replace('Concierge Essencial', 'Essential Concierge')
        .replace('Concierge Completo', 'Complete Concierge')
        .replace('Concierge Premium', 'Premium Concierge');
}

module.exports = { t, planName };
