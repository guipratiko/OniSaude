/**
 * Valida CPF brasileiro
 */
const validarCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
};

/**
 * Valida email
 */
const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida data no formato DD/MM/AAAA
 */
const validarData = (data) => {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!regex.test(data)) return false;

  const [, dia, mes, ano] = data.match(regex);
  const date = new Date(ano, mes - 1, dia);

  return (
    date.getDate() === parseInt(dia) &&
    date.getMonth() === parseInt(mes) - 1 &&
    date.getFullYear() === parseInt(ano)
  );
};

/**
 * Converte data DD/MM/AAAA para AAAA-MM-DD
 */
const converterDataParaISO = (data) => {
  const [dia, mes, ano] = data.split('/');
  return `${ano}-${mes}-${dia}`;
};

/**
 * Valida telefone brasileiro
 */
const validarTelefone = (telefone) => {
  const cleaned = telefone.replace(/[^\d]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
};

/**
 * Formata CPF
 */
const formatarCPF = (cpf) => {
  const cleaned = cpf.replace(/[^\d]/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Limpa CPF (remove formatação)
 */
const limparCPF = (cpf) => {
  return cpf.replace(/[^\d]/g, '');
};

/**
 * Valida CEP
 */
const validarCEP = (cep) => {
  const cleaned = cep.replace(/[^\d]/g, '');
  return cleaned.length === 8;
};

/**
 * Formata CEP
 */
const formatarCEP = (cep) => {
  const cleaned = cep.replace(/[^\d]/g, '');
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
};

/**
 * Valida senha (mínimo 6 caracteres)
 */
const validarSenha = (senha) => {
  return senha && senha.length >= 6;
};

module.exports = {
  validarCPF,
  validarEmail,
  validarData,
  converterDataParaISO,
  validarTelefone,
  formatarCPF,
  limparCPF,
  validarCEP,
  formatarCEP,
  validarSenha
};

