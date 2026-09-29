# Ritmo — planner de rotina e hábitos (Alcatech)

App web instalável (PWA), sem custo e sem servidor. Os dados ficam no próprio aparelho.

## Publicar de graça (GitHub Pages)
1. Crie um repositório novo no GitHub (ex.: `ritmo`) e envie todos os arquivos desta pasta para a raiz dele.
2. No repositório: Settings → Pages → Source: "Deploy from a branch" → branch `main`, pasta `/ (root)` → Save.
3. Depois de ~1 minuto o app fica em `https://SEU-USUARIO.github.io/ritmo/`.

## Instalar no iPhone
1. Abra o endereço acima no **Safari**.
2. Toque em Compartilhar → **Adicionar à Tela de Início**.
3. Abra pelo ícone. Funciona offline.

## Lembretes com o app fechado
Ajustes → "Baixar calendário (.ics)" → abra o arquivo no iPhone → **Adicionar todos**.
Se mudar a semana-modelo, apague o calendário "Ritmo" e importe de novo.

## Backup
Ajustes → Exportar (gera um .json). Importar restaura em outro aparelho.

## Atualizar o app depois
Ao alterar arquivos, mude `const V = 'ritmo-v1'` em `sw.js` (ex.: `ritmo-v2`) para o iPhone baixar a versão nova.
