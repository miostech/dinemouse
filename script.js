// Número WhatsApp (E.164 sem +): +1 407-429-5155
const WHATSAPP_BUSINESS_NUMBER = '14074295155';

// Endpoint para gravar o lead no MongoDB (servidor local em dev-server.js). Mesma origem em dev/prod.
const CONTACT_LEADS_API = '/api/contact-leads';
const B2B_LEADS_API = '/api/b2b-leads';
const PORTAL_REGISTER_API = '/api/portal/register';
const AUTH_LOGIN_API = '/api/auth/login';
const AUTH_FORGOT_PASSWORD_API = '/api/auth/forgot-password';

async function syncPortalUserToServer(email, password, userData) {
    try {
        const r = await fetch(PORTAL_REGISTER_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, userData }),
        });
        if (!r.ok) {
            const t = await r.text();
            console.warn('portal-register:', r.status, t);
        }
    } catch (err) {
        console.warn('portal-register:', err);
    }
}

// ============================================
// CUSTOM MODALS (Alert, Confirm, Prompt)
// ============================================

/**
 * Modal customizado para substituir alert()
 */
function customAlert(message, title = 'Aviso') {
    return new Promise((resolve) => {
        const overlay = document.getElementById('customModalOverlay');
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('customModalTitle');
        const modalMessage = document.getElementById('customModalMessage');
        const modalFooter = document.getElementById('customModalFooter');
        const inputContainer = document.getElementById('customModalInputContainer');
        
        // Esconder input
        inputContainer.style.display = 'none';
        
        // Configurar conteúdo
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Criar botão OK
        modalFooter.innerHTML = `
            <button class="custom-modal-btn custom-modal-btn-primary" id="customModalOkBtn">
                OK
            </button>
        `;
        
        // Mostrar modal
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Fechar ao clicar em OK
        const okBtn = document.getElementById('customModalOkBtn');
        okBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            destroyModalParticles('customModalParticles');
            resolve();
        });
        
        // Fechar ao clicar no overlay
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                destroyModalParticles('customModalParticles');
                resolve();
            }
        });
        
        // Fechar com ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                destroyModalParticles('customModalParticles');
                document.removeEventListener('keydown', escHandler);
                resolve();
            }
        };
        document.addEventListener('keydown', escHandler);
    });
}

/**
 * Modal customizado para substituir confirm()
 */
function customConfirm(message, title = 'Confirmação') {
    return new Promise((resolve) => {
        const overlay = document.getElementById('customModalOverlay');
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('customModalTitle');
        const modalMessage = document.getElementById('customModalMessage');
        const modalFooter = document.getElementById('customModalFooter');
        const inputContainer = document.getElementById('customModalInputContainer');
        
        // Esconder input
        inputContainer.style.display = 'none';
        
        // Configurar conteúdo
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Criar botões
        modalFooter.innerHTML = `
            <button class="custom-modal-btn custom-modal-btn-secondary" id="customModalCancelBtn">
                Cancelar
            </button>
            <button class="custom-modal-btn custom-modal-btn-primary" id="customModalConfirmBtn">
                Confirmar
            </button>
        `;
        
        // Mostrar modal
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Inicializar partículas
        initModalParticles('customModalParticles');
        
        // Botão Cancelar
        const cancelBtn = document.getElementById('customModalCancelBtn');
        cancelBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            destroyModalParticles('customModalParticles');
            resolve(false);
        });
        
        // Botão Confirmar
        const confirmBtn = document.getElementById('customModalConfirmBtn');
        confirmBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            destroyModalParticles('customModalParticles');
            resolve(true);
        });
        
        // Fechar ao clicar no overlay (retorna false)
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                destroyModalParticles('customModalParticles');
                resolve(false);
            }
        });
        
        // Fechar com ESC (retorna false)
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                destroyModalParticles('customModalParticles');
                document.removeEventListener('keydown', escHandler);
                resolve(false);
            }
        };
        document.addEventListener('keydown', escHandler);
    });
}

/**
 * Modal customizado para substituir prompt()
 */
function customPrompt(message, defaultValue = '', title = 'Entrada', inputType = 'text') {
    return new Promise((resolve) => {
        const overlay = document.getElementById('customModalOverlay');
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('customModalTitle');
        const modalMessage = document.getElementById('customModalMessage');
        const modalFooter = document.getElementById('customModalFooter');
        const inputContainer = document.getElementById('customModalInputContainer');
        const input = document.getElementById('customModalInput');
        
        // Mostrar input
        inputContainer.style.display = 'block';
        input.value = defaultValue;
        input.type = inputType === 'password' ? 'password' : 'text';
        input.placeholder = inputType === 'password' ? '••••••••' : 'Digite aqui...';
        input.autocomplete = inputType === 'password' ? 'new-password' : 'off';
        
        // Configurar conteúdo
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Criar botões
        modalFooter.innerHTML = `
            <button class="custom-modal-btn custom-modal-btn-secondary" id="customModalCancelBtn">
                Cancelar
            </button>
            <button class="custom-modal-btn custom-modal-btn-primary" id="customModalConfirmBtn">
                OK
            </button>
        `;
        
        // Mostrar modal
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Inicializar partículas
        initModalParticles('customModalParticles');
        
        // Focar no input
        setTimeout(() => input.focus(), 100);
        
        // Botão Cancelar
        const cancelBtn = document.getElementById('customModalCancelBtn');
        cancelBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            inputContainer.style.display = 'none';
            destroyModalParticles('customModalParticles');
            resolve(null);
        });
        
        // Botão OK
        const confirmBtn = document.getElementById('customModalConfirmBtn');
        const handleConfirm = () => {
            const value = input.value.trim();
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            inputContainer.style.display = 'none';
            destroyModalParticles('customModalParticles');
            resolve(value);
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        
        // Enter no input
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
            }
        });
        
        // Fechar ao clicar no overlay (retorna null)
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                inputContainer.style.display = 'none';
                destroyModalParticles('customModalParticles');
                resolve(null);
            }
        });
        
        // Fechar com ESC (retorna null)
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                inputContainer.style.display = 'none';
                destroyModalParticles('customModalParticles');
                document.removeEventListener('keydown', escHandler);
                resolve(null);
            }
        };
        document.addEventListener('keydown', escHandler);
    });
}

// ============================================
// SUBSCRIPTION MODAL
// ============================================
let subscriptionData = {
    plan: null, // { alerts: number, price: number }
    themePark: '',
    restaurants: [], // Array de restaurantes selecionados
    extras: {
        whatsapp: false,
        additionalPhone: 0
    }
};

function openSubscriptionModal() {
    const modal = document.getElementById('subscriptionModal');
    if (modal) {
        // Resetar dados
        subscriptionData = {
            plan: null,
            themePark: '',
            restaurants: [],
            extras: {
                whatsapp: false,
                additionalPhone: 0
            }
        };
        
        // Mostrar passo 1, esconder passo 2 e 3
        document.getElementById('subscriptionStep1').style.display = 'block';
        document.getElementById('subscriptionStep2').style.display = 'none';
        document.getElementById('subscriptionStep3').style.display = 'none';
        document.getElementById('subscriptionCTA').style.display = 'none';
        document.getElementById('subscriptionCTA3').style.display = 'none';
        document.getElementById('subscriptionSecurityNote').style.display = 'none';
        
        // Resetar seleção de planos
        document.querySelectorAll('.subscription-plan-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Inicializar partículas
        initModalParticles('subscriptionModalParticles');
    }
}

function closeSubscriptionModal() {
    const modal = document.getElementById('subscriptionModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Destruir partículas
        destroyModalParticles('subscriptionModalParticles');
    }
}

function selectSubscriptionPlan(alerts, price) {
    subscriptionData.plan = { alerts, price };
    
    // Atualizar visual dos cards
    document.querySelectorAll('.subscription-plan-card').forEach(card => {
        card.classList.remove('selected');
        if (parseInt(card.dataset.alerts) === alerts) {
            card.classList.add('selected');
        }
    });
    
    // Ir para o passo 2
    document.getElementById('subscriptionStep1').style.display = 'none';
    document.getElementById('subscriptionStep2').style.display = 'block';
    document.getElementById('subscriptionCTA').style.display = 'flex';
    document.getElementById('subscriptionSecurityNote').style.display = 'block';
    document.getElementById('subscriptionTermsBlock').style.display = 'block';
    
    // Atualizar limite de alertas
    document.getElementById('alertsLimit').textContent = alerts;
    document.getElementById('alertsUsed').textContent = '0';
    
    // Atualizar preço
    updateSubscriptionPrice();
}

function backToPlanSelection() {
    document.getElementById('subscriptionStep1').style.display = 'block';
    document.getElementById('subscriptionStep2').style.display = 'none';
    document.getElementById('subscriptionStep3').style.display = 'none';
    document.getElementById('subscriptionCTA').style.display = 'none';
    document.getElementById('subscriptionCTA3').style.display = 'none';
    document.getElementById('subscriptionSecurityNote').style.display = 'none';
    document.getElementById('subscriptionTermsBlock').style.display = 'none';
    
    // Limpar checkbox
    const termsCheckbox = document.getElementById('subscriptionTermsCheckbox');
    if (termsCheckbox) termsCheckbox.checked = false;
}

function backToSubscriptionStep2() {
    document.getElementById('subscriptionStep2').style.display = 'block';
    document.getElementById('subscriptionStep3').style.display = 'none';
    document.getElementById('subscriptionCTA').style.display = 'flex';
    document.getElementById('subscriptionCTA3').style.display = 'none';
    document.getElementById('subscriptionSecurityNote').style.display = 'block';
    document.getElementById('subscriptionTermsBlock').style.display = 'block';
}

function updateSubscriptionRestaurants() {
    const parkSelect = document.getElementById('subscriptionThemePark');
    const restaurantSelect = document.getElementById('subscriptionRestaurant');
    if (!parkSelect || !restaurantSelect) return;
    
    const selectedPark = parkSelect.value;
    subscriptionData.themePark = selectedPark;
    
    // Usar a mesma função de restaurantes do modal de pagamento
    updateRestaurantsByParkForSubscription(selectedPark, restaurantSelect);
}

function updateRestaurantsByParkForSubscription(selectedPark, restaurantSelect) {
    const restaurantsByPark = getRestaurantsByPark();
    
    restaurantSelect.innerHTML = '<option value="">Selecione um restaurante...</option>';
    
    if (selectedPark && restaurantsByPark[selectedPark]) {
        restaurantsByPark[selectedPark].forEach(restaurant => {
            const option = document.createElement('option');
            option.value = restaurant.name;
            option.textContent = restaurant.name + (restaurant.popular ? ' ⭐ Popular' : '');
            restaurantSelect.appendChild(option);
        });
    }
}


function addSubscriptionRestaurant() {
    const restaurantSelect = document.getElementById('subscriptionRestaurant');
    if (!restaurantSelect || !restaurantSelect.value || !subscriptionData.plan) return;
    
    const restaurantName = restaurantSelect.value.replace(' ⭐ Popular', '');
    
    // Verificar se já foi adicionado
    if (subscriptionData.restaurants.includes(restaurantName)) {
        customAlert('Este restaurante já foi adicionado.', 'Aviso');
        restaurantSelect.value = '';
        return;
    }
    
    // Verificar limite de alertas
    if (subscriptionData.restaurants.length >= subscriptionData.plan.alerts) {
        customAlert(`Você atingiu o limite de ${subscriptionData.plan.alerts} alertas do seu plano.`, 'Limite Atingido');
        restaurantSelect.value = '';
        return;
    }
    
    // Adicionar restaurante
    subscriptionData.restaurants.push(restaurantName);
    
    // Atualizar lista
    updateSubscriptionRestaurantsList();
    
    // Limpar select
    restaurantSelect.value = '';
}

function updateSubscriptionRestaurantsList() {
    const restaurantsList = document.getElementById('subscriptionRestaurantsList');
    const alertsUsed = document.getElementById('alertsUsed');
    
    if (!restaurantsList || !alertsUsed) return;
    
    alertsUsed.textContent = subscriptionData.restaurants.length;
    
    if (subscriptionData.restaurants.length === 0) {
        restaurantsList.innerHTML = '';
        return;
    }
    
    restaurantsList.innerHTML = subscriptionData.restaurants.map((restaurant, index) => `
        <div class="selected-restaurant-item">
            <span class="selected-restaurant-name">🍽️ ${restaurant}</span>
            <button type="button" class="btn-remove-item" onclick="removeSubscriptionRestaurant(${index})">Remover</button>
        </div>
    `).join('');
}

function removeSubscriptionRestaurant(index) {
    subscriptionData.restaurants.splice(index, 1);
    updateSubscriptionRestaurantsList();
    updateSubscriptionPrice();
}

function changeSubscriptionPhoneQuantity(delta) {
    const phoneQuantityInput = document.getElementById('subscriptionPhoneQuantity');
    if (!phoneQuantityInput) return;
    
    let currentValue = parseInt(phoneQuantityInput.value) || 0;
    let newValue = currentValue + delta;
    newValue = Math.max(0, Math.min(10, newValue));
    
    phoneQuantityInput.value = newValue;
    subscriptionData.extras.additionalPhone = newValue;
    updateSubscriptionPrice();
}

function updateSubscriptionPhoneQuantity() {
    const phoneQuantityInput = document.getElementById('subscriptionPhoneQuantity');
    if (!phoneQuantityInput) return;
    
    let value = parseInt(phoneQuantityInput.value) || 0;
    value = Math.max(0, Math.min(10, value));
    
    phoneQuantityInput.value = value;
    subscriptionData.extras.additionalPhone = value;
    updateSubscriptionPrice();
}

function updateSubscriptionPrice() {
    if (!subscriptionData.plan) return;
    
    let totalPrice = subscriptionData.plan.price;
    
    // Adicionar extras
    if (subscriptionData.extras.whatsapp) {
        const totalPhones = 1 + subscriptionData.extras.additionalPhone;
        totalPrice += EXTRAS_PRICES.whatsapp * totalPhones;
    }
    
    if (subscriptionData.extras.additionalPhone > 0) {
        totalPrice += EXTRAS_PRICES.additionalPhone * subscriptionData.extras.additionalPhone;
    }
    
    // Atualizar exibição
    const priceValue = document.getElementById('subscriptionPriceValue');
    if (priceValue) {
        priceValue.textContent = `R$ ${totalPrice.toFixed(2)}`;
    }
    
    // Atualizar resumo de extras
    updateSubscriptionExtrasSummary();
}

function updateSubscriptionExtrasSummary() {
    const summaryExtras = document.getElementById('subscriptionSummaryExtras');
    if (!summaryExtras) return;
    
    const extrasList = [];
    
    if (subscriptionData.extras.whatsapp) {
        const totalPhones = 1 + subscriptionData.extras.additionalPhone;
        const total = EXTRAS_PRICES.whatsapp * totalPhones;
        extrasList.push({
            label: `Notificação WhatsApp (${totalPhones} telefone${totalPhones > 1 ? 's' : ''})`,
            price: total
        });
    }
    
    if (subscriptionData.extras.additionalPhone > 0) {
        const total = EXTRAS_PRICES.additionalPhone * subscriptionData.extras.additionalPhone;
        extrasList.push({
            label: `Telefone${subscriptionData.extras.additionalPhone > 1 ? 's' : ''} Adicional${subscriptionData.extras.additionalPhone > 1 ? 'is' : ''} (${subscriptionData.extras.additionalPhone}x)`,
            price: total
        });
    }
    
    if (extrasList.length === 0) {
        summaryExtras.innerHTML = '';
        return;
    }
    
    summaryExtras.innerHTML = extrasList.map(extra => `
        <div class="summary-row summary-extra-row">
            <span class="summary-label">${extra.label}:</span>
            <span class="summary-value">R$ ${extra.price.toFixed(2)}</span>
        </div>
    `).join('');
}

function handleSubscriptionCheckout() {
    // Validar checkbox de termos
    const termsCheckbox = document.getElementById('subscriptionTermsCheckbox');
    if (!termsCheckbox || !termsCheckbox.checked) {
        customAlert('Por favor, aceite os Termos de Uso e a Política de Privacidade para continuar.', 'Atenção');
        return;
    }
    
    if (!subscriptionData.plan) {
        customAlert('Por favor, selecione um plano primeiro.', 'Atenção');
        return;
    }
    
    if (subscriptionData.restaurants.length === 0) {
        customAlert('Por favor, adicione pelo menos um restaurante.', 'Atenção');
        return;
    }
    
    const whatsappCheckbox = document.getElementById('subscriptionWhatsApp');
    subscriptionData.extras.whatsapp = whatsappCheckbox ? whatsappCheckbox.checked : false;
    
    console.log('Checkout subscrição:', subscriptionData);
    
    (async () => {
        const confirmCheckout = await customConfirm(
            `Confirmar assinatura de R$ ${subscriptionData.plan.price.toFixed(2)}/mês?\n\n` +
            `Plano: ${subscriptionData.plan.alerts} alertas\n` +
            `Restaurantes: ${subscriptionData.restaurants.length}\n` +
            `Você será redirecionado para a página de pagamento seguro.`,
            'Confirmar Assinatura'
        );
        
        if (confirmCheckout) {
            // Simular processamento de pagamento (em produção, aqui seria a integração com gateway)
            // Após pagamento confirmado, mostrar passo 3 para coletar dados
            setupSubscriptionPhones();
            document.getElementById('subscriptionStep2').style.display = 'none';
            document.getElementById('subscriptionStep3').style.display = 'block';
            document.getElementById('subscriptionCTA').style.display = 'none';
            document.getElementById('subscriptionCTA3').style.display = 'flex';
            document.getElementById('subscriptionSecurityNote').style.display = 'none';
            document.getElementById('subscriptionTermsBlock').style.display = 'none';
        }
    })();
}

// Lista de países com códigos telefônicos
const countryCodes = [
    { code: '+55', name: 'Brasil', flag: '🇧🇷' },
    { code: '+1', name: 'Estados Unidos / Canadá', flag: '🇺🇸' },
    { code: '+44', name: 'Reino Unido', flag: '🇬🇧' },
    { code: '+33', name: 'França', flag: '🇫🇷' },
    { code: '+49', name: 'Alemanha', flag: '🇩🇪' },
    { code: '+39', name: 'Itália', flag: '🇮🇹' },
    { code: '+34', name: 'Espanha', flag: '🇪🇸' },
    { code: '+351', name: 'Portugal', flag: '🇵🇹' },
    { code: '+52', name: 'México', flag: '🇲🇽' },
    { code: '+54', name: 'Argentina', flag: '🇦🇷' },
    { code: '+56', name: 'Chile', flag: '🇨🇱' },
    { code: '+57', name: 'Colômbia', flag: '🇨🇴' },
    { code: '+81', name: 'Japão', flag: '🇯🇵' },
    { code: '+86', name: 'China', flag: '🇨🇳' },
    { code: '+61', name: 'Austrália', flag: '🇦🇺' },
    { code: '+7', name: 'Rússia', flag: '🇷🇺' },
    { code: '+91', name: 'Índia', flag: '🇮🇳' },
    { code: '+82', name: 'Coreia do Sul', flag: '🇰🇷' },
    { code: '+31', name: 'Holanda', flag: '🇳🇱' },
    { code: '+32', name: 'Bélgica', flag: '🇧🇪' },
    { code: '+41', name: 'Suíça', flag: '🇨🇭' },
    { code: '+46', name: 'Suécia', flag: '🇸🇪' },
    { code: '+47', name: 'Noruega', flag: '🇳🇴' },
    { code: '+45', name: 'Dinamarca', flag: '🇩🇰' },
    { code: '+358', name: 'Finlândia', flag: '🇫🇮' },
    { code: '+353', name: 'Irlanda', flag: '🇮🇪' },
    { code: '+48', name: 'Polônia', flag: '🇵🇱' },
    { code: '+90', name: 'Turquia', flag: '🇹🇷' },
    { code: '+971', name: 'Emirados Árabes', flag: '🇦🇪' },
    { code: '+27', name: 'África do Sul', flag: '🇿🇦' },
    { code: '+64', name: 'Nova Zelândia', flag: '🇳🇿' },
    { code: '+65', name: 'Singapura', flag: '🇸🇬' },
    { code: '+852', name: 'Hong Kong', flag: '🇭🇰' },
    { code: '+886', name: 'Taiwan', flag: '🇹🇼' },
    { code: '+0', name: 'Outro', flag: '🌍' }
];

function setupSubscriptionPhones() {
    const container = document.getElementById('subscriptionPhonesContainer');
    if (!container) return;
    
    // Calcular quantidade de telefones: 1 por padrão + extras se contratados
    const totalPhones = 1 + subscriptionData.extras.additionalPhone;
    
    container.innerHTML = '';
    
    for (let i = 0; i < totalPhones; i++) {
        const phoneDiv = document.createElement('div');
        phoneDiv.className = 'phone-input-group';
        phoneDiv.style.marginBottom = '1.5rem';
        
        const label = document.createElement('label');
        label.className = 'payment-label';
        label.textContent = i === 0 ? 'Telefone principal *' : `Telefone adicional ${i} *`;
        label.style.fontSize = '0.9rem';
        label.style.marginBottom = '0.5rem';
        label.style.display = 'block';
        
        // Container para país e telefone
        const phoneRow = document.createElement('div');
        phoneRow.className = 'phone-row';
        phoneRow.style.display = 'flex';
        phoneRow.style.gap = '0.75rem';
        phoneRow.style.alignItems = 'flex-start';
        
        // Select de país
        const countrySelect = document.createElement('select');
        countrySelect.className = 'payment-select phone-country-select';
        countrySelect.id = `subscriptionCountry${i}`;
        countrySelect.name = `subscriptionCountry${i}`;
        countrySelect.required = true;
        countrySelect.style.width = '180px';
        countrySelect.style.flexShrink = '0';
        
        // Adicionar opções de países
        countryCodes.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = `${country.flag} ${country.code} ${country.name}`;
            if (country.code === '+55' && country.name === 'Brasil') {
                option.selected = true; // Brasil como padrão
            }
            countrySelect.appendChild(option);
        });
        
        // Input de telefone
        const input = document.createElement('input');
        input.type = 'tel';
        input.className = 'payment-input phone-number-input';
        input.id = `subscriptionPhone${i}`;
        input.name = `subscriptionPhone${i}`;
        input.placeholder = '(00) 00000-0000';
        input.required = true;
        input.style.flex = '1';
        input.setAttribute('data-phone-index', i);
        
        // Adicionar máscara de telefone baseada no país
        let currentMaskHandler = null;
        
        function applyPhoneMask(countryCode, phoneInput) {
            // Remover listener anterior se existir
            if (currentMaskHandler) {
                phoneInput.removeEventListener('input', currentMaskHandler);
            }
            
            // Criar novo handler
            currentMaskHandler = function(e) {
                let value = e.target.value.replace(/\D/g, '');
                // Máscara padrão para Brasil
                if (countryCode === '+55') {
                    if (value.length <= 10) {
                        value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                    } else {
                        value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
                    }
                }
                // Para outros países, manter apenas números (sem máscara)
                e.target.value = value;
            };
            
            phoneInput.addEventListener('input', currentMaskHandler);
        }
        
        // Aplicar máscara inicial
        applyPhoneMask(countrySelect.value, input);
        
        // Atualizar máscara quando país mudar
        countrySelect.addEventListener('change', function() {
            input.value = '';
            input.placeholder = countrySelect.value === '+55' ? '(00) 00000-0000' : 'Número de telefone';
            applyPhoneMask(countrySelect.value, input);
        });
        
        phoneRow.appendChild(countrySelect);
        phoneRow.appendChild(input);
        
        phoneDiv.appendChild(label);
        phoneDiv.appendChild(phoneRow);
        container.appendChild(phoneDiv);
    }
}

function handleSubscriptionUserData() {
    // Validar nome
    const nameInput = document.getElementById('subscriptionUserName');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
        customAlert('Por favor, informe seu nome completo.', 'Atenção');
        return;
    }
    
    // Validar email
    const emailInput = document.getElementById('subscriptionUserEmail');
    const email = emailInput ? emailInput.value.trim() : '';
    if (!email || !email.includes('@')) {
        customAlert('Por favor, informe um email válido.', 'Atenção');
        return;
    }
    
    // Coletar telefones com país
    const totalPhones = 1 + subscriptionData.extras.additionalPhone;
    const phones = [];
    for (let i = 0; i < totalPhones; i++) {
        const countrySelect = document.getElementById(`subscriptionCountry${i}`);
        const phoneInput = document.getElementById(`subscriptionPhone${i}`);
        
        if (!countrySelect || !countrySelect.value) {
            customAlert(`Por favor, selecione o país do telefone ${i === 0 ? 'principal' : `adicional ${i}`}.`, 'Atenção');
            return;
        }
        
        if (phoneInput) {
            const phone = phoneInput.value.trim();
            if (!phone) {
                customAlert(`Por favor, informe o telefone ${i === 0 ? 'principal' : `adicional ${i}`}.`, 'Atenção');
                return;
            }
            phones.push({
                country: countrySelect.value,
                number: phone,
                full: `${countrySelect.value} ${phone}`
            });
        }
    }
    
    // Adicionar dados do usuário ao subscriptionData
    subscriptionData.userData = {
        name: name,
        email: email,
        phones: phones
    };
    
    // Processar pagamento e enviar email
    simulatePaymentAndSendEmail('subscription', subscriptionData);
    closeSubscriptionModal();
}

// Fechar modal de subscrição ao clicar fora ou pressionar Escape
document.addEventListener('DOMContentLoaded', () => {
    const subscriptionModal = document.getElementById('subscriptionModal');
    if (subscriptionModal) {
        subscriptionModal.addEventListener('click', (e) => {
            if (e.target === subscriptionModal) {
                closeSubscriptionModal();
            }
        });
    }
    
    // Fechar com Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const subscriptionModal = document.getElementById('subscriptionModal');
            if (subscriptionModal && subscriptionModal.classList.contains('active')) {
                closeSubscriptionModal();
            }
        }
    });
    
    // Atualizar extras quando checkbox muda
    const whatsappCheckbox = document.getElementById('subscriptionWhatsApp');
    if (whatsappCheckbox) {
        whatsappCheckbox.addEventListener('change', () => {
            subscriptionData.extras.whatsapp = whatsappCheckbox.checked;
            updateSubscriptionPrice();
        });
    }
});

// ============================================
// PARTICLE SYSTEM
// ============================================
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 50;
        
        this.resize();
        this.init();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Twinkle effect
            particle.twinkle += 0.02;
            const opacity = particle.opacity + Math.sin(particle.twinkle) * 0.2;
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(230, 199, 122, ${opacity})`;
            this.ctx.fill();
            
            // Draw glow
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.radius * 3
            );
            gradient.addColorStop(0, `rgba(230, 199, 122, ${opacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(230, 199, 122, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize particle system
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particles-canvas');
    if (canvas) {
        new ParticleSystem(canvas);
    }
});

// ============================================
// MODAL PARTICLE SYSTEMS MANAGEMENT
// ============================================
const modalParticleSystems = {};

function initModalParticles(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (canvas && !modalParticleSystems[canvasId]) {
        modalParticleSystems[canvasId] = new ParticleSystem(canvas);
    }
}

function destroyModalParticles(canvasId) {
    if (modalParticleSystems[canvasId]) {
        // Limpar o canvas
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        // Remover referência
        delete modalParticleSystems[canvasId];
    }
}

// ============================================
// NAVIGATION
// ============================================
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });

    // Close menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-menu a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80; // Navbar height
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.background = 'rgba(11, 28, 45, 0.98)';
        navbar.style.boxShadow = '0 4px 16px rgba(11, 28, 45, 0.2)';
    } else {
        navbar.style.background = 'rgba(11, 28, 45, 0.95)';
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// ============================================
// SCROLL ANIMATIONS (AOS)
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
        }
    });
}, observerOptions);

// Observe all elements with data-aos
document.querySelectorAll('[data-aos]').forEach(el => {
    observer.observe(el);
});

// ============================================
// CTA FUNCTIONS
// ============================================
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function scrollToCTA() {
    const ctaSection = document.getElementById('contato');
    if (ctaSection) {
        const offset = 80;
        const targetPosition = ctaSection.getBoundingClientRect().top + window.pageYOffset - offset;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

function openWhatsApp() {
    const message = encodeURIComponent('Olá! Gostaria de solicitar reservas nos parques temáticos.');
    const url = `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${message}`;
    window.open(url, '_blank');
}

function openForm() {
    const modal = document.getElementById('formModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Inicializar partículas
        initModalParticles('formModalParticles');
    }
}

function closeForm() {
    const modal = document.getElementById('formModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Destruir partículas
        destroyModalParticles('formModalParticles');
    }
}

// Close modal when clicking outside
const modal = document.getElementById('formModal');
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeForm();
        }
    });
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeForm();
    }
});

// ============================================
// FORM HANDLING
// ============================================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);

        const submitButton = contactForm.querySelector('.btn-submit');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Enviando...';
        submitButton.disabled = true;

        let savedOk = false;
        try {
            const res = await fetch(CONTACT_LEADS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'modal',
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    dates: data.dates,
                    parks: data.parks,
                    restaurants: data.restaurants || '',
                    message: data.message || '',
                }),
            });
            savedOk = res.ok;
        } catch (err) {
            console.warn('Lead não gravado no servidor:', err);
        }

        const alertMsg = savedOk
            ? 'Obrigado! Recebemos sua solicitação. Entraremos em contato em breve via WhatsApp.'
            : 'Não foi possível guardar o pedido no nosso sistema agora. Estamos a abrir o WhatsApp para não perder o seu contacto.';
        const alertTitle = savedOk ? 'Sucesso' : 'Atenção';
        await customAlert(alertMsg, alertTitle);

        const waText = encodeURIComponent(
            `Olá! Meu nome é ${data.name}.\n` +
                `E-mail: ${data.email}\n` +
                `WhatsApp: ${data.phone}\n` +
                `Datas: ${data.dates}\n` +
                `Parques: ${data.parks}\n` +
                `Restaurantes desejados: ${data.restaurants || 'Não especificado'}\n` +
                `Mensagem: ${data.message || 'Nenhuma mensagem adicional'}`
        );
        window.open(`https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${waText}`, '_blank');

        contactForm.reset();
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        closeForm();
    });
}

// ============================================
// PARALLAX EFFECT (Optional)
// ============================================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    
    if (hero) {
        const rate = scrolled * 0.5;
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================
// Throttle scroll events
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply throttling to scroll handlers
const optimizedScrollHandler = throttle(() => {
    // Scroll-based animations can go here
}, 16); // ~60fps

window.addEventListener('scroll', optimizedScrollHandler);

// ============================================
// LOADING ANIMATION
// ============================================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Animate hero content
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroCTA = document.querySelector('.hero-cta');
    
    if (heroTitle) heroTitle.style.animation = 'fadeInUp 1s ease';
    if (heroSubtitle) heroSubtitle.style.animation = 'fadeInUp 1.2s ease';
    if (heroCTA) heroCTA.style.animation = 'fadeInUp 1.4s ease';
});

// ============================================
// PAYMENT MODAL
// ============================================
// O modal de pagamento aparece quando:
// 1. O usuário clica no botão "Criar Alerta" do plano Individual
// 2. Ou quando openPaymentModal() é chamado programaticamente
//
// Para testar: role até a seção de planos e clique em "Criar Alerta"

// Dados do modal (serão preenchidos pelo usuário)
let paymentModalData = {
    themePark: '',
    selectedRestaurant: '',
    dates: [],
    duration: 12,
    activeUntil: '',
    extras: {
        whatsapp: false,
        additionalPhone: 0 // Quantidade de telefones adicionais (não inclui o base do WhatsApp)
    }
};

// Preços dos extras
const EXTRAS_PRICES = {
    whatsapp: 8, // R$ 8 / telefone (1 base + telefones adicionais)
    additionalPhone: 5 // R$ 5 / telefone adicional
};

// Função para calcular o preço baseado nos dias à frente
function calculatePriceByDaysAhead(daysAhead) {
    if (daysAhead <= 30) {
        return 15; // R$ 15 por alerta até 30 dias
    } else if (daysAhead <= 45) {
        return 20; // R$ 20 por alerta de 31-45 dias
    } else {
        return 30; // R$ 30 por alerta de 46-60 dias
    }
}

function openPaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        console.log('Abrindo modal de pagamento...');
        
        // Resetar dados
        paymentModalData = {
            themePark: '',
            selectedRestaurant: '',
            dates: [],
            duration: 12,
            activeUntil: '',
            extras: {
                whatsapp: false,
                additionalPhone: 0
            }
        };
        
        // Resetar checkboxes de extras
        const whatsappCheckbox = document.getElementById('extraWhatsApp');
        const phoneQuantityInput = document.getElementById('phoneQuantity');
        
        if (whatsappCheckbox) whatsappCheckbox.checked = false;
        if (phoneQuantityInput) phoneQuantityInput.value = 0;
        
        // Configurar date picker (hoje até 60 dias à frente)
        setupDatePicker();
        
        // Limpar formulários
        resetPaymentForm();
        
        // Limpar resumo de extras
        const summaryExtras = document.getElementById('summaryExtras');
        if (summaryExtras) summaryExtras.innerHTML = '';
        
        // Limpar checkbox de termos
        const termsCheckbox = document.getElementById('paymentTermsCheckbox');
        if (termsCheckbox) termsCheckbox.checked = false;
        
        // Esconder passo 3 e mostrar conteúdo principal
        const paymentStep3 = document.getElementById('paymentStep3');
        const paymentBody = document.querySelector('#paymentModal .payment-modal-body');
        if (paymentStep3) paymentStep3.style.display = 'none';
        if (paymentBody) {
            Array.from(paymentBody.children).forEach(child => {
                if (child.id !== 'paymentStep3') {
                    child.style.display = 'block';
                }
            });
        }
        document.getElementById('paymentCTA').style.display = 'flex';
        document.getElementById('paymentCTA3').style.display = 'none';
        document.getElementById('paymentTermsBlock').style.display = 'block';
        document.getElementById('paymentSecurityNote').style.display = 'block';
        
        // Atualizar preço inicial (R$ 0,00)
        updatePrice();
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Inicializar partículas
        initModalParticles('paymentModalParticles');
        
        // Focar no modal para acessibilidade
        const closeButton = modal.querySelector('.payment-modal-close');
        if (closeButton) {
            setTimeout(() => closeButton.focus(), 100);
        }
    } else {
        console.error('Modal de pagamento não encontrado! Verifique se o elemento #paymentModal existe no HTML.');
    }
}

function setupDatePicker() {
    const dateInput = document.getElementById('paymentDateInput');
    if (dateInput) {
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 60);
        
        dateInput.min = today.toISOString().split('T')[0];
        dateInput.max = maxDate.toISOString().split('T')[0];
    }
}

function resetPaymentForm() {
    // Limpar selects
    const parkSelect = document.getElementById('paymentThemePark');
    const restaurantSelect = document.getElementById('paymentRestaurant');
    const dateInput = document.getElementById('paymentDateInput');
    const mealSelect = document.getElementById('paymentMealType');
    const partySizeInput = document.getElementById('paymentPartySize');
    
    if (parkSelect) parkSelect.value = '';
    if (restaurantSelect) restaurantSelect.innerHTML = '<option value="">Selecione um restaurante...</option>';
    if (dateInput) dateInput.value = '';
    if (mealSelect) mealSelect.value = 'Jantar';
    if (partySizeInput) partySizeInput.value = '2';
    
    // Limpar listas
    const selectedRestaurantsList = document.getElementById('selectedRestaurantsList');
    const datesList = document.getElementById('paymentDatesList');
    const noDatesMessage = document.getElementById('noDatesMessage');
    
    if (selectedRestaurantsList) selectedRestaurantsList.innerHTML = '';
    if (datesList) datesList.innerHTML = '';
    if (noDatesMessage && datesList) {
        datesList.innerHTML = '<p class="no-dates-message" id="noDatesMessage">Nenhuma data adicionada ainda. Use o formulário acima para adicionar.</p>';
    }
    
    // Atualizar preço
    updatePrice();
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Destruir partículas
        destroyModalParticles('paymentModalParticles');
    }
}

function updatePrice() {
    // Calcular preço total somando o preço de cada data
    let totalPrice = 0;
    
    paymentModalData.dates.forEach(dateItem => {
        totalPrice += dateItem.price || 0;
    });
    
    // Adicionar preço dos extras
    // WhatsApp: cobrado por telefone (1 base + telefones adicionais)
    if (paymentModalData.extras.whatsapp) {
        const totalPhones = 1 + paymentModalData.extras.additionalPhone; // 1 base + adicionais
        totalPrice += EXTRAS_PRICES.whatsapp * totalPhones;
    }
    
    // Telefones adicionais (só cobrado se WhatsApp não estiver selecionado, ou sempre cobrado separadamente?)
    // Pelo que entendi, telefones adicionais são cobrados separadamente a R$ 5 cada
    if (paymentModalData.extras.additionalPhone > 0) {
        totalPrice += EXTRAS_PRICES.additionalPhone * paymentModalData.extras.additionalPhone;
    }
    
    paymentModalData.price = totalPrice;
    
    const priceValue = document.querySelector('.price-value');
    if (priceValue) {
        priceValue.textContent = `R$ ${totalPrice.toFixed(2)}`;
    }
    
    // Atualizar resumo de extras
    updateExtrasSummary();
    
    // Atualizar duração baseada nas datas
    updateDuration();
}

// Atualizar extras selecionados
function updateExtras() {
    const whatsappCheckbox = document.getElementById('extraWhatsApp');
    
    paymentModalData.extras.whatsapp = whatsappCheckbox ? whatsappCheckbox.checked : false;
    
    // Atualizar preço
    updatePrice();
}

// Alterar quantidade de telefones
function changePhoneQuantity(delta) {
    const phoneQuantityInput = document.getElementById('phoneQuantity');
    if (!phoneQuantityInput) return;
    
    let currentValue = parseInt(phoneQuantityInput.value) || 0;
    let newValue = currentValue + delta;
    
    // Limitar entre 0 e 10
    newValue = Math.max(0, Math.min(10, newValue));
    
    phoneQuantityInput.value = newValue;
    paymentModalData.extras.additionalPhone = newValue;
    
    // Atualizar preço
    updatePrice();
}

// Atualizar quantidade de telefones quando o input muda
function updatePhoneQuantity() {
    const phoneQuantityInput = document.getElementById('phoneQuantity');
    if (!phoneQuantityInput) return;
    
    let value = parseInt(phoneQuantityInput.value) || 0;
    value = Math.max(0, Math.min(10, value));
    
    phoneQuantityInput.value = value;
    paymentModalData.extras.additionalPhone = value;
    
    // Atualizar preço
    updatePrice();
}

// Atualizar resumo de extras no resumo de pagamento
function updateExtrasSummary() {
    const summaryExtras = document.getElementById('summaryExtras');
    if (!summaryExtras) return;
    
    const extrasList = [];
    
    // WhatsApp: mostra total de telefones (1 base + adicionais)
    if (paymentModalData.extras.whatsapp) {
        const totalPhones = 1 + paymentModalData.extras.additionalPhone;
        const total = EXTRAS_PRICES.whatsapp * totalPhones;
        extrasList.push({
            label: `Notificação WhatsApp (${totalPhones} telefone${totalPhones > 1 ? 's' : ''})`,
            price: total
        });
    }
    
    // Telefones adicionais (sempre cobrados separadamente)
    if (paymentModalData.extras.additionalPhone > 0) {
        const total = EXTRAS_PRICES.additionalPhone * paymentModalData.extras.additionalPhone;
        extrasList.push({
            label: `Telefone${paymentModalData.extras.additionalPhone > 1 ? 's' : ''} Adicional${paymentModalData.extras.additionalPhone > 1 ? 'is' : ''} (${paymentModalData.extras.additionalPhone}x)`,
            price: total
        });
    }
    
    if (extrasList.length === 0) {
        summaryExtras.innerHTML = '';
        return;
    }
    
    summaryExtras.innerHTML = extrasList.map(extra => `
        <div class="summary-row summary-extra-row">
            <span class="summary-label">${extra.label}:</span>
            <span class="summary-value">R$ ${extra.price.toFixed(2)}</span>
        </div>
    `).join('');
}

// Atualizar restaurantes baseado no parque selecionado
// Função auxiliar para obter lista de restaurantes por parque
function getRestaurantsByPark() {
    return {
        'walt-disney-world': [
            { name: "Chef Mickey's", popular: true },
            { name: "Be Our Guest Restaurant", popular: false },
            { name: "Cinderella's Royal Table", popular: true },
            { name: "Le Cellier Steakhouse", popular: false },
            { name: "Space 220 Restaurant", popular: true },
            { name: "The Crystal Palace", popular: false },
            { name: "Liberty Tree Tavern", popular: false },
            { name: "Jungle Navigation Co. Skipper Canteen", popular: false },
            { name: "Tony's Town Square Restaurant", popular: false },
            { name: "Akershus Royal Banquet Hall", popular: true },
            { name: "Coral Reef Restaurant", popular: false },
            { name: "Chefs de France", popular: false },
            { name: "Monsieur Paul", popular: true },
            { name: "Rose & Crown Dining Room", popular: false },
            { name: "Garden Grill Restaurant", popular: false },
            { name: "Biergarten Restaurant", popular: false },
            { name: "San Angel Inn Restaurante", popular: false },
            { name: "Teppan Edo", popular: false },
            { name: "Tokyo Dining", popular: false },
            { name: "Sci-Fi Dine-In Theater Restaurant", popular: true },
            { name: "Hollywood & Vine", popular: false },
            { name: "Mama Melrose's Ristorante Italiano", popular: false },
            { name: "The Hollywood Brown Derby", popular: true },
            { name: "Tiffins Restaurant", popular: false },
            { name: "Yak & Yeti™ Restaurant", popular: false },
            { name: "Tusker House Restaurant", popular: true },
            { name: "Rainforest Cafe (AK entrance)", popular: false },
            { name: "'Ohana", popular: true },
            { name: "California Grill", popular: true },
            { name: "Topolino's Terrace", popular: true },
            { name: "Boma – Flavors of Africa", popular: false },
            { name: "Sanaa", popular: false },
            { name: "Whispering Canyon Café", popular: false },
            { name: "Sebastian's Bistro", popular: false },
            { name: "Ale & Compass Restaurant", popular: false },
            { name: "Narcoossee's", popular: true },
            { name: "Victoria & Albert's", popular: true },
            { name: "Jaleo by José Andrés", popular: true },
            { name: "Morimoto Asia", popular: true },
            { name: "The BOATHOUSE", popular: false },
            { name: "Wine Bar George", popular: false },
            { name: "STK Steakhouse", popular: true },
            { name: "Paddlefish", popular: false },
            { name: "Planet Hollywood", popular: false }
        ],
        'disneyland': [
            { name: "Blue Bayou Restaurant", popular: true },
            { name: "Café Orleans", popular: false },
            { name: "Carnation Café", popular: false },
            { name: "Plaza Inn (Character Dining – breakfast)", popular: true },
            { name: "River Belle Terrace", popular: false },
            { name: "Carthay Circle Restaurant", popular: true },
            { name: "Lamplight Lounge", popular: true },
            { name: "Wine Country Trattoria", popular: false },
            { name: "Napa Rose", popular: true },
            { name: "Goofy's Kitchen", popular: true },
            { name: "Storytellers Cafe", popular: false },
            { name: "Din Tai Fung", popular: true },
            { name: "Naples Ristorante e Bar", popular: false },
            { name: "Jazz Kitchen Coastal Grill", popular: false }
        ],
        'disneyland-paris': [
            { name: "Auberge de Cendrillon", popular: true },
            { name: "Walt's – An American Restaurant", popular: false },
            { name: "Agrabah Café Restaurant", popular: false },
            { name: "Captain Jack's – Restaurant des Pirates", popular: false },
            { name: "Plaza Gardens Restaurant", popular: false },
            { name: "Bistrot Chez Rémy", popular: true },
            { name: "Annette's Diner", popular: false },
            { name: "Rainforest Café", popular: false },
            { name: "Billy Bob's Country Western Saloon", popular: false },
            { name: "Manhattan Restaurant", popular: false },
            { name: "Downtown Restaurant", popular: false },
            { name: "Inventions (quando ativo)", popular: true }
        ],
        'tokyo-disney': [
            { name: "Restaurant Hokusai", popular: false },
            { name: "Blue Bayou Restaurant (Tokyo)", popular: true },
            { name: "Eastside Café", popular: false },
            { name: "Center Street Coffeehouse", popular: false },
            { name: "Crystal Palace Restaurant", popular: false },
            { name: "Magellan's", popular: true },
            { name: "Ristorante di Canaletto", popular: false },
            { name: "S.S. Columbia Dining Room", popular: false },
            { name: "Oceano (Hotel MiraCosta)", popular: true },
            { name: "Silk Road Garden", popular: false },
            { name: "BellaVista Lounge", popular: false }
        ]
    };
}

function updateRestaurantsByPark() {
    const parkSelect = document.getElementById('paymentThemePark');
    const restaurantSelect = document.getElementById('paymentRestaurant');
    if (!parkSelect || !restaurantSelect) return;
    
    const selectedPark = parkSelect.value;
    paymentModalData.themePark = selectedPark;
    
    const restaurantsByPark = getRestaurantsByPark();
    
    // Limpar select de restaurantes
    restaurantSelect.innerHTML = '<option value="">Selecione um restaurante...</option>';
    
    // Preencher select com restaurantes do parque selecionado
    if (selectedPark && restaurantsByPark[selectedPark]) {
        restaurantsByPark[selectedPark].forEach(restaurant => {
            const option = document.createElement('option');
            option.value = restaurant.name;
            option.textContent = restaurant.name + (restaurant.popular ? ' ⭐ Popular' : '');
            restaurantSelect.appendChild(option);
        });
    }
    
    // Limpar restaurante selecionado quando mudar o parque
    paymentModalData.selectedRestaurant = '';
    updateSelectedRestaurantsList();
}

// Adicionar restaurante selecionado à lista
function addRestaurant() {
    const restaurantSelect = document.getElementById('paymentRestaurant');
    if (!restaurantSelect || !restaurantSelect.value) {
        customAlert('Por favor, selecione um restaurante primeiro.', 'Atenção');
        return;
    }
    
    const restaurantName = restaurantSelect.value.replace(' ⭐ Popular', '');
    
    // Verificar se já foi adicionado
    if (paymentModalData.selectedRestaurant === restaurantName) {
        customAlert('Este restaurante já foi selecionado.', 'Aviso');
        return;
    }
    
    paymentModalData.selectedRestaurant = restaurantName;
    updateSelectedRestaurantsList();
}

function updateSelectedRestaurantsList() {
    const selectedRestaurantsList = document.getElementById('selectedRestaurantsList');
    if (!selectedRestaurantsList) return;
    
    if (paymentModalData.selectedRestaurant) {
        selectedRestaurantsList.innerHTML = `
            <div class="selected-restaurant-item">
                <span class="selected-restaurant-name">🍽️ ${paymentModalData.selectedRestaurant}</span>
                <button type="button" class="btn-remove-item" onclick="removeRestaurant()">Remover</button>
            </div>
        `;
    } else {
        selectedRestaurantsList.innerHTML = '';
    }
}

function removeRestaurant() {
    paymentModalData.selectedRestaurant = '';
    updateSelectedRestaurantsList();
    
    const restaurantSelect = document.getElementById('paymentRestaurant');
    if (restaurantSelect) restaurantSelect.value = '';
}

// Validar data (deve estar dentro de 60 dias)
function validateDate() {
    const dateInput = document.getElementById('paymentDateInput');
    if (!dateInput || !dateInput.value) return true;
    
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 60);
    maxDate.setHours(23, 59, 59, 999);
    
    if (selectedDate < today) {
        customAlert('A data não pode ser no passado.', 'Atenção');
        dateInput.value = '';
        return false;
    }
    
    if (selectedDate > maxDate) {
        customAlert('A data não pode ser mais de 60 dias à frente.', 'Atenção');
        dateInput.value = '';
        return false;
    }
    
    return true;
}

// Adicionar data ao alerta
function addDate() {
    // Validar campos obrigatórios
    const parkSelect = document.getElementById('paymentThemePark');
    const restaurantSelect = document.getElementById('paymentRestaurant');
    const dateInput = document.getElementById('paymentDateInput');
    const mealSelect = document.getElementById('paymentMealType');
    const partySizeInput = document.getElementById('paymentPartySize');
    
    if (!parkSelect || !parkSelect.value) {
        customAlert('Por favor, selecione um parque temático primeiro.', 'Atenção');
        return;
    }
    
    if (!restaurantSelect || !restaurantSelect.value) {
        customAlert('Por favor, selecione um restaurante primeiro.', 'Atenção');
        return;
    }
    
    if (!dateInput || !dateInput.value) {
        customAlert('Por favor, selecione uma data.', 'Atenção');
        return;
    }
    
    if (!validateDate()) {
        return;
    }
    
    const selectedDate = new Date(dateInput.value);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    // Calcular dias à frente
    const diffTime = selectedDate - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calcular preço baseado nos dias à frente
    const price = calculatePriceByDaysAhead(diffDays);
    
    const formattedDate = formatDate(selectedDate);
    const meal = mealSelect ? mealSelect.value : 'Jantar';
    const partySize = partySizeInput ? parseInt(partySizeInput.value) : 2;
    
    // Obter nome do restaurante selecionado
    const restaurantName = restaurantSelect.value.replace(' ⭐ Popular', '');
    
    // Verificar se a data já foi adicionada (mesma data, restaurante e refeição)
    const dateString = dateInput.value;
    const existingDate = paymentModalData.dates.find(d => 
        d.dateString === dateString && 
        d.meal === meal && 
        d.restaurant === restaurantName
    );
    if (existingDate) {
        customAlert('Esta data, restaurante e tipo de refeição já foram adicionados.', 'Aviso');
        return;
    }
    
    // Calcular quantos dias o alerta ficará ativo (data selecionada + 12 dias de monitoramento)
    const expirationDate = new Date(selectedDate);
    expirationDate.setDate(expirationDate.getDate() + 12);
    const activeDays = Math.ceil((expirationDate - todayDate) / (1000 * 60 * 60 * 24));
    
    // Adicionar data com preço calculado
    paymentModalData.dates.push({
        dateString: dateString,
        date: formattedDate,
        restaurant: restaurantName,
        meal: meal,
        partySize: partySize,
        daysAhead: diffDays,
        price: price,
        activeDays: activeDays,
        expirationDate: expirationDate
    });
    
    // Limpar formulário
    dateInput.value = '';
    if (mealSelect) mealSelect.value = 'Jantar';
    if (partySizeInput) partySizeInput.value = '2';
    
    // Atualizar lista e preço
    updateDatesList();
    updatePrice();
}

// Formatar data para exibição
function formatDate(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName}, ${monthName} ${day}, ${year}`;
}

// Atualizar lista de datas
function updateDatesList() {
    const datesList = document.getElementById('paymentDatesList');
    if (!datesList) return;
    
    if (paymentModalData.dates.length === 0) {
        datesList.innerHTML = '<p class="no-dates-message" id="noDatesMessage">Nenhuma data adicionada ainda. Use o formulário acima para adicionar.</p>';
        return;
    }
    
    datesList.innerHTML = paymentModalData.dates.map((dateItem, index) => {
        const expirationFormatted = dateItem.expirationDate ? formatDate(dateItem.expirationDate) : '';
        return `
        <div class="date-item">
            <div class="date-item-content">
                <span class="date-text">${dateItem.date}</span>
                <div class="date-restaurant">🍽️ ${dateItem.restaurant || 'Restaurante não definido'}</div>
                <div class="date-details">
                    <span class="meal-type">☑ ${dateItem.meal}</span>
                    <span class="party-size">${dateItem.partySize} pessoas</span>
                    <span class="date-price">R$ ${dateItem.price.toFixed(2)}</span>
                </div>
                <div class="date-duration">⏰ Alerta ativo por ${dateItem.activeDays || 0} dias • Ativo até ${expirationFormatted}</div>
            </div>
            <button type="button" class="btn-remove-date" onclick="removeDate(${index})">Remover</button>
        </div>
        `;
    }).join('');
}

// Remover data
function removeDate(index) {
    paymentModalData.dates.splice(index, 1);
    updateDatesList();
    updatePrice();
}

// Atualizar duração baseada nas datas (não usado mais, mas mantido para compatibilidade)
function updateDuration() {
    // A duração agora é calculada individualmente para cada data no card
    // Esta função não precisa fazer mais nada
}

// Atualizar quando restaurante é selecionado
document.addEventListener('DOMContentLoaded', () => {
    const restaurantSelect = document.getElementById('paymentRestaurant');
    if (restaurantSelect) {
        restaurantSelect.addEventListener('change', () => {
            if (restaurantSelect.value) {
                addRestaurant();
            }
        });
    }
});

function handleCheckout() {
    // Validar checkbox de termos
    const termsCheckbox = document.getElementById('paymentTermsCheckbox');
    if (!termsCheckbox || !termsCheckbox.checked) {
        customAlert('Por favor, aceite os Termos de Uso e a Política de Privacidade para continuar.', 'Atenção');
        return;
    }
    
    // Validar dados antes do checkout
    if (!paymentModalData.themePark) {
        customAlert('Por favor, selecione um parque temático.', 'Atenção');
        return;
    }
    
    if (!paymentModalData.selectedRestaurant) {
        customAlert('Por favor, selecione um restaurante.', 'Atenção');
        return;
    }
    
    if (paymentModalData.dates.length === 0) {
        customAlert('Por favor, adicione pelo menos uma data.', 'Atenção');
        return;
    }
    
    // Aqui você integraria com Stripe, PayPal, ou outro gateway de pagamento
    console.log('Iniciando checkout...', paymentModalData);
    
    (async () => {
        const confirmCheckout = await customConfirm(
            `Confirmar pagamento de R$ ${paymentModalData.price.toFixed(2)}?\n\n` +
            `Parque: ${document.getElementById('paymentThemePark').selectedOptions[0].text}\n` +
            `Restaurante: ${paymentModalData.selectedRestaurant}\n` +
            `Datas: ${paymentModalData.dates.length} data(s)\n\n` +
            `Você será redirecionado para a página de pagamento seguro.`,
            'Confirmar Pagamento'
        );
        
        if (confirmCheckout) {
            // Simular processamento de pagamento (em produção, aqui seria a integração com gateway)
            // Após pagamento confirmado, mostrar passo 3 para coletar dados
            setupPaymentPhones();
            
            // Esconder conteúdo do passo 2
            const paymentBody = document.querySelector('#paymentModal .payment-modal-body');
            if (paymentBody) {
                Array.from(paymentBody.children).forEach(child => {
                    if (child.id !== 'paymentStep3') {
                        child.style.display = 'none';
                    }
                });
            }
            
            // Mostrar passo 3
            document.getElementById('paymentStep3').style.display = 'block';
            document.getElementById('paymentCTA').style.display = 'none';
            document.getElementById('paymentCTA3').style.display = 'flex';
            document.getElementById('paymentTermsBlock').style.display = 'none';
            document.getElementById('paymentSecurityNote').style.display = 'none';
        }
    })();
}

function setupPaymentPhones() {
    const container = document.getElementById('paymentPhonesContainer');
    if (!container) return;
    
    // Calcular quantidade de telefones: 1 por padrão + extras se contratados
    const totalPhones = 1 + (paymentModalData.extras.additionalPhone || 0);
    
    container.innerHTML = '';
    
    for (let i = 0; i < totalPhones; i++) {
        const phoneDiv = document.createElement('div');
        phoneDiv.className = 'phone-input-group';
        phoneDiv.style.marginBottom = '1.5rem';
        
        const label = document.createElement('label');
        label.className = 'payment-label';
        label.textContent = i === 0 ? 'Telefone principal *' : `Telefone adicional ${i} *`;
        label.style.fontSize = '0.9rem';
        label.style.marginBottom = '0.5rem';
        label.style.display = 'block';
        
        // Container para país e telefone
        const phoneRow = document.createElement('div');
        phoneRow.className = 'phone-row';
        phoneRow.style.display = 'flex';
        phoneRow.style.gap = '0.75rem';
        phoneRow.style.alignItems = 'flex-start';
        
        // Select de país
        const countrySelect = document.createElement('select');
        countrySelect.className = 'payment-select phone-country-select';
        countrySelect.id = `paymentCountry${i}`;
        countrySelect.name = `paymentCountry${i}`;
        countrySelect.required = true;
        countrySelect.style.width = '180px';
        countrySelect.style.flexShrink = '0';
        
        // Adicionar opções de países
        countryCodes.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = `${country.flag} ${country.code} ${country.name}`;
            if (country.code === '+55' && country.name === 'Brasil') {
                option.selected = true; // Brasil como padrão
            }
            countrySelect.appendChild(option);
        });
        
        // Input de telefone
        const input = document.createElement('input');
        input.type = 'tel';
        input.className = 'payment-input phone-number-input';
        input.id = `paymentPhone${i}`;
        input.name = `paymentPhone${i}`;
        input.placeholder = '(00) 00000-0000';
        input.required = true;
        input.style.flex = '1';
        input.setAttribute('data-phone-index', i);
        
        // Adicionar máscara de telefone baseada no país
        let currentMaskHandler = null;
        
        function applyPhoneMask(countryCode, phoneInput) {
            // Remover listener anterior se existir
            if (currentMaskHandler) {
                phoneInput.removeEventListener('input', currentMaskHandler);
            }
            
            // Criar novo handler
            currentMaskHandler = function(e) {
                let value = e.target.value.replace(/\D/g, '');
                // Máscara padrão para Brasil
                if (countryCode === '+55') {
                    if (value.length <= 10) {
                        value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                    } else {
                        value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
                    }
                }
                // Para outros países, manter apenas números (sem máscara)
                e.target.value = value;
            };
            
            phoneInput.addEventListener('input', currentMaskHandler);
        }
        
        // Aplicar máscara inicial
        applyPhoneMask(countrySelect.value, input);
        
        // Atualizar máscara quando país mudar
        countrySelect.addEventListener('change', function() {
            input.value = '';
            input.placeholder = countrySelect.value === '+55' ? '(00) 00000-0000' : 'Número de telefone';
            applyPhoneMask(countrySelect.value, input);
        });
        
        phoneRow.appendChild(countrySelect);
        phoneRow.appendChild(input);
        
        phoneDiv.appendChild(label);
        phoneDiv.appendChild(phoneRow);
        container.appendChild(phoneDiv);
    }
}

function backToPaymentStep2() {
    // Mostrar conteúdo do passo 2
    const paymentBody = document.querySelector('#paymentModal .payment-modal-body');
    if (paymentBody) {
        Array.from(paymentBody.children).forEach(child => {
            if (child.id !== 'paymentStep3') {
                child.style.display = 'block';
            }
        });
    }
    
    // Esconder passo 3
    document.getElementById('paymentStep3').style.display = 'none';
    document.getElementById('paymentCTA').style.display = 'flex';
    document.getElementById('paymentCTA3').style.display = 'none';
    document.getElementById('paymentTermsBlock').style.display = 'block';
    document.getElementById('paymentSecurityNote').style.display = 'block';
}

function handlePaymentUserData() {
    // Validar nome
    const nameInput = document.getElementById('paymentUserName');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
        customAlert('Por favor, informe seu nome completo.', 'Atenção');
        return;
    }
    
    // Validar email
    const emailInput = document.getElementById('paymentUserEmail');
    const email = emailInput ? emailInput.value.trim() : '';
    if (!email || !email.includes('@')) {
        customAlert('Por favor, informe um email válido.', 'Atenção');
        return;
    }
    
    // Coletar telefones com país
    const totalPhones = 1 + (paymentModalData.extras.additionalPhone || 0);
    const phones = [];
    for (let i = 0; i < totalPhones; i++) {
        const countrySelect = document.getElementById(`paymentCountry${i}`);
        const phoneInput = document.getElementById(`paymentPhone${i}`);
        
        if (!countrySelect || !countrySelect.value) {
            customAlert(`Por favor, selecione o país do telefone ${i === 0 ? 'principal' : `adicional ${i}`}.`, 'Atenção');
            return;
        }
        
        if (phoneInput) {
            const phone = phoneInput.value.trim();
            if (!phone) {
                customAlert(`Por favor, informe o telefone ${i === 0 ? 'principal' : `adicional ${i}`}.`, 'Atenção');
                return;
            }
            phones.push({
                country: countrySelect.value,
                number: phone,
                full: `${countrySelect.value} ${phone}`
            });
        }
    }
    
    // Adicionar dados do usuário ao paymentModalData
    paymentModalData.userData = {
        name: name,
        email: email,
        phones: phones
    };
    
    // Processar pagamento e enviar email
    simulatePaymentAndSendEmail('alerts', paymentModalData);
    closePaymentModal();
}

// Fechar modal ao clicar fora
const paymentModal = document.getElementById('paymentModal');
if (paymentModal) {
    paymentModal.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            closePaymentModal();
        }
    });
}

// Fechar modal com Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const paymentModal = document.getElementById('paymentModal');
        if (paymentModal && paymentModal.classList.contains('active')) {
            closePaymentModal();
        }
    }
});

// Função para atualizar dados do modal (pode ser chamada antes de abrir)
function setPaymentModalData(data) {
    paymentModalData = { ...paymentModalData, ...data };
}

// ============================================
// ACCESSIBILITY
// ============================================
// Keyboard navigation for modal
if (modal) {
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    });
}

// ============================================
// CONCIERGE MODAL
// ============================================
let conciergeData = {
    plan: '', // 'essencial', 'completo', 'premium'
    price: 0,
    tripDateStart: '',
    tripDateEnd: '',
    partySize: 2,
    contactName: '',
    phoneCountry: '+55',
    phone: ''
};

const conciergePlanNames = {
    'essencial': 'Concierge Essencial',
    'completo': 'Concierge Completo',
    'premium': 'Concierge Premium'
};

function openConciergeModal(plan, price) {
    const modal = document.getElementById('conciergeModal');
    if (!modal) return;
    
    // Resetar dados
    conciergeData = {
        plan: plan,
        price: price,
        tripDateStart: '',
        tripDateEnd: '',
        partySize: 2,
        contactName: '',
        phoneCountry: '+55',
        phone: ''
    };
    
    // Atualizar informações do plano
    const planNameElement = document.getElementById('conciergePlanName');
    const planPriceElement = document.getElementById('conciergePlanPrice');
    const totalPriceElement = document.getElementById('conciergeTotalPrice');
    
    if (planNameElement) {
        planNameElement.textContent = conciergePlanNames[plan] || plan;
    }
    
    if (planPriceElement) {
        planPriceElement.textContent = price.toFixed(2).replace('.', ',');
    }
    
    if (totalPriceElement) {
        totalPriceElement.textContent = `R$ ${price.toFixed(2).replace('.', ',')}`;
    }
    
    // Configurar date pickers (hoje em diante)
    const dateStartInput = document.getElementById('conciergeTripDateStart');
    const dateEndInput = document.getElementById('conciergeTripDateEnd');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    if (dateStartInput) {
        dateStartInput.min = todayStr;
        dateStartInput.value = '';
        dateStartInput.addEventListener('change', function() {
            // Quando a data inicial muda, atualizar o mínimo da data final
            if (dateEndInput && this.value) {
                dateEndInput.min = this.value;
                if (dateEndInput.value && dateEndInput.value < this.value) {
                    dateEndInput.value = '';
                }
            }
        });
    }
    
    if (dateEndInput) {
        dateEndInput.min = todayStr;
        dateEndInput.value = '';
    }
    
    // Resetar campos
    const partySizeInput = document.getElementById('conciergePartySize');
    const contactNameInput = document.getElementById('conciergeContactName');
    const phoneInput = document.getElementById('conciergePhone');
    const phoneCountrySelect = document.getElementById('conciergePhoneCountry');
    
    if (partySizeInput) partySizeInput.value = '2';
    if (contactNameInput) contactNameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (phoneCountrySelect) phoneCountrySelect.value = '+55';
    
    // Limpar checkbox de termos
    const termsCheckbox = document.getElementById('conciergeTermsCheckbox');
    if (termsCheckbox) termsCheckbox.checked = false;
    
    // Atualizar placeholder do telefone baseado no país
    if (phoneCountrySelect && phoneInput) {
        phoneCountrySelect.addEventListener('change', function() {
            updatePhonePlaceholder(this.value, phoneInput);
        });
        updatePhonePlaceholder(phoneCountrySelect.value, phoneInput);
    }
    
    // Mostrar modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Inicializar partículas
    initModalParticles('conciergeModalParticles');
    
    // Focar no primeiro campo
    if (dateStartInput) {
        setTimeout(() => dateStartInput.focus(), 100);
    }
}

function closeConciergeModal() {
    const modal = document.getElementById('conciergeModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Destruir partículas
        destroyModalParticles('conciergeModalParticles');
    }
}

function handleConciergeCheckout() {
    // Validar checkbox de termos
    const termsCheckbox = document.getElementById('conciergeTermsCheckbox');
    if (!termsCheckbox || !termsCheckbox.checked) {
        customAlert('Por favor, aceite os Termos de Uso e a Política de Privacidade para continuar.', 'Atenção');
        return;
    }
    
    // Coletar dados do formulário
    const dateStartInput = document.getElementById('conciergeTripDateStart');
    const dateEndInput = document.getElementById('conciergeTripDateEnd');
    const partySizeInput = document.getElementById('conciergePartySize');
    const contactNameInput = document.getElementById('conciergeContactName');
    const phoneInput = document.getElementById('conciergePhone');
    const phoneCountrySelect = document.getElementById('conciergePhoneCountry');
    
    if (!dateStartInput || !dateEndInput || !partySizeInput || !contactNameInput || !phoneInput || !phoneCountrySelect) {
        customAlert('Erro ao processar formulário. Tente novamente.', 'Erro');
        return;
    }
    
    const tripDateStart = dateStartInput.value;
    const tripDateEnd = dateEndInput.value;
    const partySize = parseInt(partySizeInput.value) || 2;
    const contactName = contactNameInput.value.trim();
    const phoneCountry = phoneCountrySelect.value;
    const phone = phoneInput.value.trim();
    
    // Validações
    if (!tripDateStart) {
        customAlert('Por favor, informe a data inicial da viagem.', 'Atenção');
        dateStartInput.focus();
        return;
    }
    
    if (!tripDateEnd) {
        customAlert('Por favor, informe a data final da viagem.', 'Atenção');
        dateEndInput.focus();
        return;
    }
    
    if (new Date(tripDateEnd) < new Date(tripDateStart)) {
        customAlert('A data final deve ser posterior à data inicial.', 'Atenção');
        dateEndInput.focus();
        return;
    }
    
    if (partySize < 1 || partySize > 20) {
        customAlert('Por favor, informe um número válido de pessoas (1 a 20).', 'Atenção');
        partySizeInput.focus();
        return;
    }
    
    if (!contactName || contactName.length < 2) {
        customAlert('Por favor, informe o nome completo para contato.', 'Atenção');
        contactNameInput.focus();
        return;
    }
    
    if (!phoneCountry) {
        customAlert('Por favor, selecione o país.', 'Atenção');
        phoneCountrySelect.focus();
        return;
    }
    
    if (!phone) {
        customAlert('Por favor, informe o número de telefone.', 'Atenção');
        phoneInput.focus();
        return;
    }
    
    // Atualizar dados
    conciergeData.tripDateStart = tripDateStart;
    conciergeData.tripDateEnd = tripDateEnd;
    conciergeData.partySize = partySize;
    conciergeData.contactName = contactName;
    conciergeData.phoneCountry = phoneCountry;
    conciergeData.phone = phone;
    
    // Formatar datas para exibição
    const dateStartObj = new Date(tripDateStart);
    const dateEndObj = new Date(tripDateEnd);
    const formattedDateStart = dateStartObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    const formattedDateEnd = dateEndObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    const fullPhone = phoneCountry + ' ' + phone;
    
    console.log('Checkout concierge:', conciergeData);
    
    const confirmMessage = 
        `Confirmar contratação?\n\n` +
        `Plano: ${conciergePlanNames[conciergeData.plan]}\n` +
        `Valor: R$ ${conciergeData.price.toFixed(2).replace('.', ',')}\n` +
        `Período: ${formattedDateStart} até ${formattedDateEnd}\n` +
        `Pessoas: ${partySize}\n` +
        `Contato: ${contactName}\n` +
        `Telefone: ${fullPhone}\n\n` +
        `Você será redirecionado para a página de pagamento seguro.\n` +
        `Após o pagamento, nosso concierge dedicado entrará em contato.`;
    
    (async () => {
        const confirmCheckout = await customConfirm(confirmMessage, 'Confirmar Concierge');
        
        if (confirmCheckout) {
            // Simular processamento de pagamento
            simulatePaymentAndSendEmail('concierge', conciergeData);
            closeConciergeModal();
        }
    })();
}

// Função para atualizar placeholder do telefone baseado no país
function updatePhonePlaceholder(countryCode, phoneInput) {
    if (!phoneInput) return;
    
    // Remover máscara atual
    phoneInput.value = '';
    
    switch(countryCode) {
        case '+55': // Brasil
            phoneInput.placeholder = '(11) 99999-9999';
            break;
        case '+1': // EUA/Canadá
            phoneInput.placeholder = '(555) 123-4567';
            break;
        case '+44': // Reino Unido
            phoneInput.placeholder = '7700 123456';
            break;
        case '+33': // França
            phoneInput.placeholder = '6 12 34 56 78';
            break;
        case '+49': // Alemanha
            phoneInput.placeholder = '151 23456789';
            break;
        default:
            phoneInput.placeholder = 'Número de telefone';
    }
}

// Fechar modal de concierge ao clicar fora ou pressionar Escape
document.addEventListener('DOMContentLoaded', () => {
    const conciergeModal = document.getElementById('conciergeModal');
    if (conciergeModal) {
        conciergeModal.addEventListener('click', (e) => {
            if (e.target === conciergeModal) {
                closeConciergeModal();
            }
        });
    }
    
    // Fechar com Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const conciergeModal = document.getElementById('conciergeModal');
            if (conciergeModal && conciergeModal.classList.contains('active')) {
                closeConciergeModal();
            }
        }
    });
    
    // Máscara para telefone baseada no país
    const phoneInput = document.getElementById('conciergePhone');
    const phoneCountrySelect = document.getElementById('conciergePhoneCountry');
    
    if (phoneInput && phoneCountrySelect) {
        phoneInput.addEventListener('input', function(e) {
            const countryCode = phoneCountrySelect.value;
            let value = e.target.value.replace(/\D/g, '');
            
            // Aplicar máscara baseada no país
            if (countryCode === '+55') {
                // Brasil
                if (value.length <= 11) {
                    if (value.length <= 10) {
                        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                    } else {
                        value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                    }
                }
            } else if (countryCode === '+1') {
                // EUA/Canadá
                if (value.length <= 10) {
                    value = value.replace(/(\d{3})(\d{3})(\d{0,4})/, '($1) $2-$3');
                }
            }
            // Para outros países, deixar livre
            
            e.target.value = value;
        });
        
        // Atualizar máscara quando o país muda
        phoneCountrySelect.addEventListener('change', function() {
            phoneInput.value = '';
            updatePhonePlaceholder(this.value, phoneInput);
        });
    }
});

// ============================================
// HELP CONTACT FORM - grava lead no MongoDB e redireciona ao WhatsApp
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const helpForm = document.getElementById('helpContactForm');
    if (helpForm) {
        helpForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = helpForm.querySelector('.help-submit-btn');
            const submitSpan = submitBtn?.querySelector('span');
            const originalBtnText = submitSpan ? submitSpan.textContent : '';

            // Coletar dados do formulário
            const formData = {
                firstName: document.getElementById('helpFirstName').value.trim(),
                lastName: document.getElementById('helpLastName').value.trim(),
                email: document.getElementById('helpEmail').value.trim(),
                country: document.getElementById('helpCountry').value,
                phoneCountry: document.getElementById('helpPhoneCountry').value,
                phone: document.getElementById('helpPhone').value.trim(),
                parks: document.getElementById('helpParks').value,
                service: document.getElementById('helpService').value,
                travelDate: document.getElementById('helpTravelDate').value.trim(),
                tripType: document.querySelector('input[name="tripType"]:checked')?.value || '',
                contactPreference: document.querySelector('input[name="contactPreference"]:checked')?.value || '',
                message: document.getElementById('helpMessage').value.trim(),
            };

            // Validar campos obrigatórios
            if (
                !formData.firstName ||
                !formData.lastName ||
                !formData.email ||
                !formData.country ||
                !formData.phone ||
                !formData.parks ||
                !formData.service ||
                !formData.tripType ||
                !formData.contactPreference
            ) {
                customAlert('Por favor, preencha todos os campos obrigatórios.', 'Atenção');
                return;
            }

            if (submitSpan) submitSpan.textContent = 'Enviando...';
            if (submitBtn) submitBtn.disabled = true;

            const leadPayload = {
                source: 'help',
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                phone: `${formData.phoneCountry} ${formData.phone}`.trim(),
                dates: formData.travelDate || 'Não especificado',
                parks: formData.parks,
                restaurants: formData.service,
                message: [
                    `País/Região: ${formData.country}`,
                    `Situação: ${formData.tripType}`,
                    `Preferência de contato: ${formData.contactPreference}`,
                    formData.message && `Mensagem adicional: ${formData.message}`,
                ]
                    .filter(Boolean)
                    .join('\n'),
            };

            let savedOk = false;
            try {
                const res = await fetch(CONTACT_LEADS_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(leadPayload),
                });
                savedOk = res.ok;
            } catch (err) {
                console.warn('Lead (help) não gravado no servidor:', err);
            }

            const alertMsg = savedOk
                ? 'Obrigado! Recebemos seus dados. Estamos abrindo o WhatsApp para você falar com a equipe.'
                : 'Não foi possível guardar o pedido no sistema agora. Estamos abrindo o WhatsApp para não perder seu contato.';
            await customAlert(alertMsg, savedOk ? 'Sucesso' : 'Atenção');

            // Construir mensagem para WhatsApp
            let whatsappMessage = `Olá! Gostaria de entrar em contato com a Dine Mouse.\n\n`;
            whatsappMessage += `*INFORMAÇÕES DE CONTATO:*\n`;
            whatsappMessage += `Nome: ${formData.firstName} ${formData.lastName}\n`;
            whatsappMessage += `E-mail: ${formData.email}\n`;
            whatsappMessage += `País/Região: ${formData.country}\n`;
            whatsappMessage += `Telefone: ${formData.phoneCountry} ${formData.phone}\n\n`;
            
            whatsappMessage += `*SOBRE SUA VIAGEM:*\n`;
            whatsappMessage += `Situação: ${formData.tripType}\n`;
            if (formData.travelDate) {
                whatsappMessage += `Período: ${formData.travelDate}\n`;
            }
            whatsappMessage += `Parques de interesse: ${formData.parks}\n`;
            whatsappMessage += `Serviço de interesse: ${formData.service}\n\n`;
            
            whatsappMessage += `*PREFERÊNCIA DE CONTATO:*\n`;
            whatsappMessage += `${formData.contactPreference}\n\n`;
            
            if (formData.message) {
                whatsappMessage += `*MENSAGEM ADICIONAL:*\n`;
                whatsappMessage += `${formData.message}\n\n`;
            }
            
            whatsappMessage += `Aguardo seu retorno!`;
            
            // URL do WhatsApp (substitua pelo número real)
            const encodedMessage = encodeURIComponent(whatsappMessage);
            const whatsappUrl = `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodedMessage}`;
            
            // Abrir WhatsApp
            window.open(whatsappUrl, '_blank');

            helpForm.reset();
            if (submitSpan) submitSpan.textContent = originalBtnText;
            if (submitBtn) submitBtn.disabled = false;
        });

        // Máscara de telefone para o formulário de ajuda
        const helpPhoneInput = document.getElementById('helpPhone');
        const helpPhoneCountrySelect = document.getElementById('helpPhoneCountry');
        
        if (helpPhoneInput && helpPhoneCountrySelect) {
            helpPhoneInput.addEventListener('input', function(e) {
                const countryCode = helpPhoneCountrySelect.value;
                let value = e.target.value.replace(/\D/g, '');
                
                if (countryCode === '+55') {
                    // Brasil
                    if (value.length <= 11) {
                        if (value.length <= 10) {
                            value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                        } else {
                            value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                        }
                    }
                } else if (countryCode === '+1') {
                    // EUA/Canadá
                    if (value.length <= 10) {
                        value = value.replace(/(\d{3})(\d{3})(\d{0,4})/, '($1) $2-$3');
                    }
                }
                
                e.target.value = value;
            });
            
            helpPhoneCountrySelect.addEventListener('change', function() {
                helpPhoneInput.value = '';
                const placeholder = this.value === '+55' ? '(11) 99999-9999' : 
                                   this.value === '+1' ? '(555) 123-4567' : 'Número de telefone';
                helpPhoneInput.placeholder = placeholder;
            });
        }
    }
});

// Função para abrir portal do cliente (placeholder)
function openClientPortal() {
    openLoginModal();
}

// ============================================
// B2B MODAL
// ============================================
function resetB2BModalView() {
    const landing = document.getElementById('b2bLanding');
    const formSection = document.getElementById('b2bFormSection');
    const form = document.getElementById('b2bCompanyForm');
    if (landing) landing.hidden = false;
    if (formSection) formSection.hidden = true;
    if (form) form.reset();
}

function showB2BCompanyForm() {
    const landing = document.getElementById('b2bLanding');
    const formSection = document.getElementById('b2bFormSection');
    if (landing) landing.hidden = true;
    if (formSection) formSection.hidden = false;
    document.getElementById('b2bCompanyName')?.focus();
}

function hideB2BCompanyForm() {
    const landing = document.getElementById('b2bLanding');
    const formSection = document.getElementById('b2bFormSection');
    if (landing) landing.hidden = false;
    if (formSection) formSection.hidden = true;
}

function openB2BModal() {
    const modal = document.getElementById('b2bModal');
    if (modal) {
        resetB2BModalView();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Inicializar partículas
        initModalParticles('b2bModalParticles');
    }
}

function closeB2BModal() {
    const modal = document.getElementById('b2bModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        resetB2BModalView();
        // Destruir partículas
        destroyModalParticles('b2bModalParticles');
    }
}

function scrollToSection(sectionId) {
    setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
            const offset = 80;
            const targetPosition = section.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }, 100);
}

// Fechar modal B2B ao clicar fora ou pressionar Escape + envio do formulário B2B
document.addEventListener('DOMContentLoaded', () => {
    const b2bModal = document.getElementById('b2bModal');
    if (b2bModal) {
        b2bModal.addEventListener('click', (e) => {
            if (e.target === b2bModal) {
                closeB2BModal();
            }
        });
    }

    const b2bCompanyForm = document.getElementById('b2bCompanyForm');
    if (b2bCompanyForm) {
        b2bCompanyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitLabel = b2bCompanyForm.querySelector('.b2b-submit-btn span');
            const submitButton = b2bCompanyForm.querySelector('.b2b-submit-btn');
            const originalText = submitLabel ? submitLabel.textContent : '';
            if (submitLabel) submitLabel.textContent = 'Enviando...';
            if (submitButton) submitButton.disabled = true;

            const fd = new FormData(b2bCompanyForm);
            const payload = {
                companyName: (fd.get('companyName') || '').toString().trim(),
                contactName: (fd.get('contactName') || '').toString().trim(),
                email: (fd.get('email') || '').toString().trim(),
                phone: (fd.get('phone') || '').toString().trim(),
                country: (fd.get('country') || '').toString().trim(),
                website: (fd.get('website') || '').toString().trim(),
                monthlyVolume: (fd.get('monthlyVolume') || '').toString().trim(),
                message: (fd.get('message') || '').toString().trim(),
            };

            let savedOk = false;
            try {
                const res = await fetch(B2B_LEADS_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                savedOk = res.ok;
            } catch (err) {
                console.warn('Lead B2B não gravado no servidor:', err);
            }

            const alertMsg = savedOk
                ? 'Recebemos os dados da sua empresa. Nossa equipe comercial entrará em contato em breve.'
                : 'Não foi possível registrar sua solicitação agora. Tente novamente em instantes ou fale conosco pelo WhatsApp na página de contato.';
            await customAlert(alertMsg, savedOk ? 'Sucesso' : 'Atenção');

            if (submitLabel) submitLabel.textContent = originalText;
            if (submitButton) submitButton.disabled = false;

            if (savedOk) {
                b2bCompanyForm.reset();
                closeB2BModal();
            }
        });
    }

    // Fechar com Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const b2bModalEl = document.getElementById('b2bModal');
            if (b2bModalEl && b2bModalEl.classList.contains('active')) {
                closeB2BModal();
            }
        }
    });
});

// ============================================
// LOGIN MODAL
// ============================================
function openLoginModal() {
    // Verificar se o usuário já está logado (tem dados salvos)
    const userData = localStorage.getItem('dineMouse_userData');
    const savedEmail = localStorage.getItem('dineMouse_email');
    
    // Se já tem dados do usuário e email salvo, redirecionar direto para o portal
    if (userData && savedEmail) {
        window.location.href = '/portal';
        return;
    }
    
    // Caso contrário, abrir modal de login
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Inicializar partículas
        initModalParticles('loginModalParticles');
        
        // Focar no campo de email
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) {
            setTimeout(() => emailInput.focus(), 100);
        }
    }
}

/**
 * Contas de teste: usar apenas em /teste (não exposto no site principal).
 */
async function createTestAccount() {
    const testEmail = 'teste@dinemouse.com';
    const testPassword = 'Teste123!';
    
    // Criar dados de teste
    const testUserData = {
        email: testEmail,
        password: testPassword,
        isFirstAccess: true,
        activationDate: null,
        createdAt: new Date().toISOString(),
        plan: {
            type: 'alerts',
            name: 'Plano Individual - Alertas',
            price: 45.00,
            alerts: 3,
            conciergeName: null,
            conciergeRestaurants: []
        },
        alerts: [
            {
                id: 1,
                restaurant: "Chef Mickey's",
                park: "Walt Disney World",
                date: "2024-03-15",
                meal: "Jantar",
                partySize: 4,
                status: 'active',
                activeDays: 12,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                restaurant: "Be Our Guest Restaurant",
                park: "Walt Disney World",
                date: "2024-03-20",
                meal: "Almoço",
                partySize: 2,
                status: 'active',
                activeDays: 8,
                createdAt: new Date().toISOString()
            }
        ]
    };
    
    // Salvar dados
    localStorage.setItem('dineMouse_userData', JSON.stringify(testUserData));
    localStorage.setItem('dineMouse_email', testEmail);

    await syncPortalUserToServer(testEmail, testPassword, testUserData);

    await customAlert(
        `✅ Conta de teste criada com sucesso!\n\n` +
        `📧 Email: ${testEmail}\n` +
        `🔑 Senha: ${testPassword}\n\n` +
        `Você pode usar essas credenciais para fazer login no portal.`,
        'Conta Criada'
    );

    openLoginModal();

    setTimeout(() => {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        if (emailInput) emailInput.value = testEmail;
        if (passwordInput) passwordInput.value = testPassword;
    }, 300);
}

async function createTestConciergeAccount() {
    const testEmail = 'concierge@dinemouse.com';
    const testPassword = 'Concierge123!';
    
    // Criar dados de teste para Concierge
    const conciergeNames = ['Ana Silva', 'Carlos Mendes', 'Mariana Costa', 'Roberto Santos', 'Juliana Alves'];
    const randomConcierge = conciergeNames[Math.floor(Math.random() * conciergeNames.length)];
    
    // Calcular datas de viagem (30 dias a partir de hoje até 45 dias)
    const tripStart = new Date();
    tripStart.setDate(tripStart.getDate() + 30);
    const tripEnd = new Date();
    tripEnd.setDate(tripEnd.getDate() + 45);
    
    const testUserData = {
        email: testEmail,
        password: testPassword,
        isFirstAccess: true,
        activationDate: null,
        createdAt: new Date().toISOString(),
        plan: {
            type: 'concierge',
            name: 'Concierge Completo',
            price: 949.00,
            alerts: 0,
            conciergeName: randomConcierge,
            conciergeRestaurants: [
                "Chef Mickey's",
                "Be Our Guest Restaurant",
                "Cinderella's Royal Table",
                "Space 220 Restaurant",
                "California Grill",
                "Topolino's Terrace"
            ]
        },
        alerts: [],
        conciergeInfo: {
            name: randomConcierge,
            tripDateStart: tripStart.toISOString().split('T')[0],
            tripDateEnd: tripEnd.toISOString().split('T')[0],
            partySize: 4,
            contactName: 'Cliente Teste',
            phone: '+55 (11) 99999-9999'
        }
    };
    
    // Salvar dados
    localStorage.setItem('dineMouse_userData', JSON.stringify(testUserData));
    localStorage.setItem('dineMouse_email', testEmail);

    await syncPortalUserToServer(testEmail, testPassword, testUserData);

    await customAlert(
        `✅ Conta de teste Concierge criada com sucesso!\n\n` +
        `📧 Email: ${testEmail}\n` +
        `🔑 Senha: ${testPassword}\n\n` +
        `👤 Concierge: ${randomConcierge}\n` +
        `📅 Viagem: ${tripStart.toLocaleDateString('pt-BR')} até ${tripEnd.toLocaleDateString('pt-BR')}\n\n` +
        `Você pode usar essas credenciais para fazer login no portal.`,
        'Conta Criada'
    );

    openLoginModal();

    setTimeout(() => {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        if (emailInput) emailInput.value = testEmail;
        if (passwordInput) passwordInput.value = testPassword;
    }, 300);
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Destruir partículas
        destroyModalParticles('loginModalParticles');
        
        // Limpar formulário
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
    }
}

/**
 * Recuperação por e-mail: pedido ao servidor (token em MongoDB + Resend).
 */
async function startPasswordRecoveryFlow() {
    const emailInput = document.getElementById('loginEmail');
    const prefill = emailInput ? emailInput.value.trim() : '';

    const emailRaw = await customPrompt(
        'Informe o e-mail da sua conta Dine Mouse. Enviaremos um link para redefinir a senha:',
        prefill,
        'Recuperar senha',
        'text'
    );
    if (emailRaw === null) return;

    const email = String(emailRaw).trim().toLowerCase();
    if (!email) {
        await customAlert('Digite um e-mail válido.', 'Atenção');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        await customAlert('O formato do e-mail não é válido.', 'Atenção');
        return;
    }

    try {
        const r = await fetch(AUTH_FORGOT_PASSWORD_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const data = await r.json().catch(() => ({}));

        if (!r.ok) {
            await customAlert(
                'Não foi possível processar o pedido agora. Tente mais tarde ou use a página de contato.',
                'Erro'
            );
            return;
        }

        const base =
            data.message ||
            'Se existir uma conta com este e-mail, enviámos instruções para redefinir a senha.';
        await customAlert(
            `${base}\n\nVerifique a caixa de entrada e o spam. O link expira em 1 hora.`,
            'Recuperar senha'
        );
    } catch {
        await customAlert(
            'Não foi possível contactar o servidor. Verifique a ligação à internet ou tente mais tarde.',
            'Erro'
        );
    }
}

// Fechar modal de login ao clicar fora ou pressionar Escape
document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                closeLoginModal();
            }
        });
    }
    
    // Fechar com Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const loginModal = document.getElementById('loginModal');
            if (loginModal && loginModal.classList.contains('active')) {
                closeLoginModal();
            }
        }
    });
    
    // Submeter formulário de login (localStorage ou servidor MongoDB)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            if (!email || !password) {
                customAlert('Por favor, preencha todos os campos.', 'Atenção');
                return;
            }

            const emailNorm = email.toLowerCase();
            const userDataRaw = localStorage.getItem('dineMouse_userData');
            if (userDataRaw) {
                try {
                    const user = JSON.parse(userDataRaw);
                    const uEmail = user.email ? String(user.email).trim().toLowerCase() : '';
                    if (uEmail === emailNorm && user.password === password) {
                        if (rememberMe) {
                            localStorage.setItem('dineMouse_email', email);
                        }
                        window.location.href = '/portal';
                        return;
                    }
                } catch {
                    /* continua para API */
                }
            }

            try {
                const r = await fetch(AUTH_LOGIN_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                if (r.ok) {
                    const data = await r.json();
                    if (data.userData) {
                        localStorage.setItem('dineMouse_userData', JSON.stringify(data.userData));
                        if (rememberMe) {
                            localStorage.setItem('dineMouse_email', email);
                        }
                        window.location.href = '/portal';
                        return;
                    }
                }
            } catch {
                /* mensagem abaixo */
            }

            customAlert(
                'E-mail ou senha incorretos.\n\n' +
                    'Se redefiniu a senha pelo e-mail, use a nova senha. Caso ainda não tenha conta no servidor, faça login neste aparelho com a conta criada aqui ou use «Recuperar senha».',
                'Erro de login'
            );
        });
    }
    
    // Preencher email se estiver salvo
    const savedEmail = localStorage.getItem('dineMouse_email');
    if (savedEmail) {
        const emailInput = document.getElementById('loginEmail');
        const rememberCheckbox = document.getElementById('rememberMe');
        if (emailInput) {
            emailInput.value = savedEmail;
        }
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
});

// ============================================
// FAQ ACCORDION
// ============================================
function toggleFaq(button) {
    const faqItem = button.parentElement;
    const faqAnswer = faqItem.querySelector('.faq-answer');
    const isActive = faqItem.classList.contains('active');
    
    // Fechar todas as outras FAQs
    document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== faqItem) {
            item.classList.remove('active');
            const answer = item.querySelector('.faq-answer');
            if (answer) {
                answer.style.maxHeight = null;
            }
        }
    });
    
    // Toggle da FAQ atual
    if (isActive) {
        faqItem.classList.remove('active');
        faqAnswer.style.maxHeight = null;
    } else {
        faqItem.classList.add('active');
        faqAnswer.style.maxHeight = faqAnswer.scrollHeight + 'px';
    }
}

// ============================================
// PAYMENT PROCESSING & EMAIL SENDING
// ============================================

/**
 * Simula o processamento de pagamento e envio de email com senha
 * Em produção, isso seria feito no backend após confirmação do gateway de pagamento
 */
async function simulatePaymentAndSendEmail(planType, planData) {
    // Simular processamento de pagamento
    await customAlert('Processando pagamento...\n\nEm produção, aqui seria feita a integração com o gateway de pagamento (Stripe, PayPal, etc.).', 'Processando');
    
    // Gerar senha temporária (em produção, seria gerada no backend)
    const tempPassword = generateTemporaryPassword();
    
    // Obter dados do usuário coletados no passo 3
    let userEmail, userName, userPhones;
    
    if (planData.userData) {
        userEmail = planData.userData.email;
        userName = planData.userData.name;
        userPhones = planData.userData.phones || [];
    } else {
        // Fallback para compatibilidade (caso não tenha passado pelo passo 3)
        userEmail = await customPrompt('Por favor, informe seu email para receber as credenciais de acesso:', '', 'Email');
        if (!userEmail || !userEmail.includes('@')) {
            await customAlert('Email inválido. Por favor, tente novamente.', 'Erro');
            return;
        }
        userName = await customPrompt('Por favor, informe seu nome completo:', '', 'Nome') || 'Usuário';
        userPhones = [];
    }
    
    // Criar dados do usuário baseado no tipo de plano
    const userData = createUserDataFromPlan(planType, planData, userEmail, tempPassword);
    
    // Adicionar dados do usuário
    if (userName) {
        userData.name = userName;
    }
    if (userPhones && userPhones.length > 0) {
        userData.phones = userPhones;
    }
    
    // Salvar dados do usuário (em produção, seria salvo no backend)
    localStorage.setItem('dineMouse_userData', JSON.stringify(userData));
    localStorage.setItem('dineMouse_email', userEmail);

    await syncPortalUserToServer(userEmail, tempPassword, userData);

    // Simular envio de email
    console.log('=== SIMULAÇÃO DE EMAIL ===');
    console.log(`Para: ${userEmail}`);
    console.log(`Assunto: Bem-vindo ao Dine Mouse - Suas credenciais de acesso`);
    console.log(`\nOlá ${userName || 'Usuário'}!\n\nSeu pagamento foi processado com sucesso!\n\n`);
    console.log(`Suas credenciais de acesso ao Portal do Cliente:\n`);
    console.log(`Email: ${userEmail}`);
    console.log(`Senha temporária: ${tempPassword}\n`);
    if (userPhones && userPhones.length > 0) {
        const phonesList = userPhones.map(phone => {
            if (typeof phone === 'object' && phone.full) {
                return phone.full;
            }
            return phone;
        }).join(', ');
        console.log(`Telefones cadastrados: ${phonesList}\n`);
    }
    console.log(`Acesse: ${window.location.origin}/portal\n`);
    console.log(`IMPORTANTE: Altere sua senha no primeiro acesso.\n\n`);
    console.log(`Plano contratado: ${userData.plan.name}\n`);
    if (planType === 'subscription') {
        console.log(`Valor: R$ ${userData.plan.price.toFixed(2)}/mês\n\n`);
    } else {
        console.log(`Valor: R$ ${userData.plan.price.toFixed(2)}\n\n`);
    }
    console.log(`Atenciosamente,\nEquipe Dine Mouse`);
    console.log('========================');
    
    // Mostrar mensagem de sucesso
    let successMessage = `✅ Pagamento processado com sucesso!\n\n`;
    successMessage += `Um email foi enviado para ${userEmail} com suas credenciais de acesso.\n\n`;
    successMessage += `Credenciais temporárias:\n`;
    successMessage += `Email: ${userEmail}\n`;
    successMessage += `Senha: ${tempPassword}\n\n`;
    if (userPhones && userPhones.length > 0) {
        const phonesList = userPhones.map(phone => {
            if (typeof phone === 'object' && phone.full) {
                return phone.full;
            }
            return phone;
        }).join(', ');
        successMessage += `Telefones cadastrados: ${phonesList}\n\n`;
    }
    successMessage += `⚠️ IMPORTANTE: Guarde essas informações! Você precisará delas para acessar o portal.\n\n`;
    successMessage += `Você será redirecionado para a página de login.`;
    
    customAlert(successMessage, 'Pagamento Processado').then(() => {
        // Redirecionar para login após alguns segundos
        setTimeout(() => {
            openLoginModal();
        }, 500);
    });
}

/**
 * Gera uma senha temporária aleatória
 */
function generateTemporaryPassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

/**
 * Cria dados do usuário baseado no tipo de plano contratado
 */
function createUserDataFromPlan(planType, planData, email, password) {
    const baseData = {
        email: email,
        password: password, // Em produção, seria hash no backend
        isFirstAccess: true,
        activationDate: null, // Será preenchido quando ativar no portal
        createdAt: new Date().toISOString()
    };
    
    if (planType === 'alerts') {
        // Plano de alertas individuais
        return {
            ...baseData,
            plan: {
                type: 'alerts',
                name: 'Plano Individual - Alertas',
                price: planData.price || 0,
                alerts: planData.dates ? planData.dates.length : 0,
                conciergeName: null,
                conciergeRestaurants: []
            },
            alerts: planData.dates ? planData.dates.map((dateItem, index) => ({
                id: index + 1,
                restaurant: planData.selectedRestaurant || 'Restaurante não definido',
                park: planData.themePark || 'Parque não definido',
                date: dateItem.dateString,
                meal: dateItem.meal || 'Jantar',
                partySize: dateItem.partySize || 2,
                status: 'active',
                activeDays: dateItem.activeDays || 12,
                createdAt: new Date().toISOString()
            })) : []
        };
    } else if (planType === 'subscription') {
        // Plano de assinatura mensal
        return {
            ...baseData,
            plan: {
                type: 'alerts',
                name: `Plano Assinatura - ${planData.plan.alerts} Alertas`,
                price: planData.plan.price,
                alerts: planData.plan.alerts,
                conciergeName: null,
                conciergeRestaurants: []
            },
            alerts: planData.restaurants ? planData.restaurants.map((restaurant, index) => ({
                id: index + 1,
                restaurant: restaurant,
                park: planData.themePark || 'Parque não definido',
                date: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Datas futuras
                meal: 'Jantar',
                partySize: 2,
                status: 'active',
                activeDays: 12,
                createdAt: new Date().toISOString()
            })) : []
        };
    } else if (planType === 'concierge') {
        // Plano Concierge
        const conciergeNames = ['Ana Silva', 'Carlos Mendes', 'Mariana Costa', 'Roberto Santos', 'Juliana Alves'];
        const randomConcierge = conciergeNames[Math.floor(Math.random() * conciergeNames.length)];
        
        return {
            ...baseData,
            plan: {
                type: 'concierge',
                name: conciergePlanNames[planData.plan] || 'Concierge',
                price: planData.price,
                alerts: 0,
                conciergeName: randomConcierge,
                conciergeRestaurants: [] // Será preenchido durante a chamada com o concierge
            },
            alerts: [],
            conciergeInfo: {
                name: randomConcierge,
                tripDateStart: planData.tripDateStart,
                tripDateEnd: planData.tripDateEnd,
                partySize: planData.partySize,
                contactName: planData.contactName,
                phone: planData.phoneCountry + ' ' + planData.phone
            }
        };
    }
    
    return baseData;
}
