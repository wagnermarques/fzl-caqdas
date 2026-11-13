import { LitElement, html, css } from 'lit'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'

export class CaqdasAppDocsView extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-box {
      background: var(--md-sys-color-surface-container, #f3f5f5);
      border: 1px solid var(--md-sys-color-outline-variant, #d8e0df);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }

    h1 {
      margin: 0 0 8px 0;
      color: var(--md-sys-color-primary, #006a6a);
      font-size: 1.65rem;
    }

    .notice-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background: #ede7f6;
      color: #311b92;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 0.9rem;
      margin-top: 12px;
    }

    .card {
      background: var(--md-sys-color-surface, #fff);
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .step-card {
      border: 1px solid #e6e6e6;
      border-radius: 10px;
      padding: 16px;
      background: #fafafa;
    }

    .step-num {
      display: inline-block;
      width: 26px;
      height: 26px;
      line-height: 26px;
      text-align: center;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #006a6a);
      color: white;
      font-weight: 700;
      font-size: 0.85rem;
      margin-right: 8px;
    }

    code {
      background: #f0f3f3;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.88rem;
    }

    a.ext-link {
      color: var(--md-sys-color-primary, #006a6a);
      font-weight: 600;
      text-decoration: none;
    }

    a.ext-link:hover {
      text-decoration: underline;
    }
  `

  render() {
    return html`
      <div class="header-box">
        <h1>Documentação de Utilização do Aplicativo (Manual de Uso)</h1>
        <p style="margin: 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
          Guia operacional das telas, fluxos de trabalho, exportação de dados e persistência local no <strong>FZL CAQDAS</strong>.
        </p>

        <div class="notice-banner">
          <span>
            🛠️ <strong>Manual Técnico do Software:</strong> Este guia trata apenas do uso da ferramenta. Os textos de estudo da metodologia de Bardin ficam separados no referencial teórico.
          </span>
          <a class="ext-link" href="#/teoria-bardin">Ir para Teoria: Análise de Bardin →</a>
        </div>
      </div>

      <div class="card">
        <h2 style="margin-top: 0; color: var(--md-sys-color-primary, #006a6a);">
          Fluxo Operacional no Aplicativo
        </h2>

        <div class="grid-2">
          <div class="step-card">
            <div style="margin-bottom: 8px;">
              <span class="step-num">1</span>
              <strong>Cadastrar ou Importar Fontes</strong>
            </div>
            <p style="margin: 0; font-size: 0.92rem; color: #444; line-height: 1.5;">
              Em <a class="ext-link" href="#/fontes">Fontes &amp; Documentos</a>, visualize entrevistas carregadas ou clique em <em>Adicionar Documento</em> para inserir novas transcrições identificando o participante.
            </p>
          </div>

          <div class="step-card">
            <div style="margin-bottom: 8px;">
              <span class="step-num">2</span>
              <strong>Estruturar o Livro de Códigos</strong>
            </div>
            <p style="margin: 0; font-size: 0.92rem; color: #444; line-height: 1.5;">
              Em <a class="ext-link" href="#/codebook">Livro de Códigos</a>, organize suas categorias, atribua cores e defina o critério operacional de cada código antes ou durante a análise.
            </p>
          </div>

          <div class="step-card">
            <div style="margin-bottom: 8px;">
              <span class="step-num">3</span>
              <strong>Codificar Trechos no Texto</strong>
            </div>
            <p style="margin: 0; font-size: 0.92rem; color: #444; line-height: 1.5;">
              Em <a class="ext-link" href="#/codificacao">Área de Codificação</a>, escolha o documento, selecione um trecho com o mouse, escolha o código desejado e clique em <em>Codificar Trecho</em>.
            </p>
          </div>

          <div class="step-card">
            <div style="margin-bottom: 8px;">
              <span class="step-num">4</span>
              <strong>Comparar Casos, Registrar Memos e Exportar</strong>
            </div>
            <p style="margin: 0; font-size: 0.92rem; color: #444; line-height: 1.5;">
              Use a <a class="ext-link" href="#/comparativo">Matriz Comparativa</a> para cruzar participantes e códigos, registre reflexões em <a class="ext-link" href="#/memos">Memos</a> e baixe o projeto em JSON na tela de <a class="ext-link" href="#/relatorios">Relatórios &amp; Python</a>.
            </p>
          </div>
        </div>
      </div>

      <div class="card">
        <h2 style="margin-top: 0; color: var(--md-sys-color-primary, #006a6a);">
          Separação de Armazenamento &amp; Backup
        </h2>
        <ul style="line-height: 1.7; padding-left: 20px; margin: 0; color: #333;">
          <li>
            <strong>Dados Empíricos da Pesquisa</strong> (documentos, códigos, categorias, citações e memos analíticos): armazenados na chave <code>fzl_caqdas_research_data_v1</code> do navegador.
          </li>
          <li>
            <strong>Caderno Teórico &amp; Fontes de Bardin</strong> (anotações de estudo e referências bibliográficas): armazenados separadamente na chave <code>fzl_caqdas_theory_study_v1</code>.
          </li>
          <li>
            <strong>Exportação Python / Pandas:</strong> na aba <a class="ext-link" href="#/relatorios">Relatórios &amp; Python</a>, você pode baixar o JSON completo do projeto e utilizar o script Python pré-configurado para gerar tabelas de frequência e matrizes cruzadas.
          </li>
        </ul>
      </div>
    `
  }
}

customElements.define('caqdas-app-docs-view', CaqdasAppDocsView)
