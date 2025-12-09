/**
 * Formata um preço no padrão europeu com separador de milhares (ponto) e decimais (vírgula)
 * @param value - Valor do preço (pode ser em centavos ou decimal)
 * @param isInCents - Se true, divide por 100 antes de formatar
 * @returns Preço formatado (ex: "1.234,56")
 */
export const formatPrice = (value: number, isInCents: boolean = false): string => {
  const numValue = isInCents ? value / 100 : value;
  const fixed = numValue.toFixed(2);
  const [integer, decimal] = fixed.split('.');
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedInteger},${decimal}`;
};
