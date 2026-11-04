// Limpa a URL e a chave do Supabase (remove espaços, barra final e caminhos como /rest/v1).
const limparUrl = (u) => {
  try { return new URL(String(u || "").trim()).origin; } catch { return String(u || "").trim(); }
};
module.exports = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: limparUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim(),
  },
};
