import { useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import './Legal.css';

const privacyContent = {
  title: 'Política de Privacidade',
  description: 'Política de Privacidade da Whodo Group — como coletamos, usamos e protegemos seus dados.',
  updatedAt: '6 de março de 2026',
  sections: [
    {
      title: '1. Informações Coletadas',
      content: (
        <>
          <p>Coletamos informações que você nos fornece diretamente, como nome, e-mail, telefone e dados de perfil ao criar uma conta ou entrar em contato conosco. Também coletamos automaticamente:</p>
          <ul>
            <li>Endereço IP e dados de geolocalização aproximada</li>
            <li>Tipo de navegador, sistema operacional e dispositivo</li>
            <li>Páginas visitadas, tempo de permanência e interações no site</li>
            <li>Dados de cookies e tecnologias semelhantes</li>
          </ul>
        </>
      ),
    },
    {
      title: '2. Como Usamos Seus Dados',
      content: (
        <>
          <p>Utilizamos as informações coletadas para:</p>
          <ul>
            <li>Fornecer e melhorar nossos serviços</li>
            <li>Personalizar sua experiência no site</li>
            <li>Enviar comunicações relevantes, como newsletters e atualizações</li>
            <li>Analisar métricas de uso e desempenho</li>
            <li>Cumprir obrigações legais e regulatórias</li>
          </ul>
        </>
      ),
    },
    {
      title: '3. Compartilhamento de Dados',
      content: (
        <p>Não vendemos seus dados pessoais. Podemos compartilhar informações com prestadores de serviço que nos auxiliam na operação do site (hospedagem, analytics, envio de e-mails), sempre sob acordos de confidencialidade. Também podemos divulgar dados quando exigido por lei ou para proteger nossos direitos legais.</p>
      ),
    },
    {
      title: '4. Integração com Instagram / Meta',
      content: (
        <>
          <p>Nosso aplicativo pode se conectar à API do Instagram (Meta) para funcionalidades como publicação e gerenciamento de conteúdo. Ao autorizar essa integração, os seguintes dados podem ser acessados:</p>
          <ul>
            <li>Informações básicas do perfil Instagram</li>
            <li>Conteúdo publicado (posts, stories, mídia)</li>
            <li>Métricas de engajamento</li>
          </ul>
          <p>Esses dados são utilizados exclusivamente para fornecer as funcionalidades do serviço e não são compartilhados com terceiros não autorizados.</p>
        </>
      ),
    },
    {
      title: '5. Cookies',
      content: (
        <p>Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos (como Google Analytics e Meta Pixel) para entender o comportamento dos visitantes. Você pode gerenciar suas preferências de cookies a qualquer momento através do banner de consentimento ou das configurações do seu navegador.</p>
      ),
    },
    {
      title: '6. Seus Direitos (LGPD)',
      content: (
        <>
          <p>De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
          <ul>
            <li>Confirmar a existência de tratamento de dados</li>
            <li>Acessar, corrigir ou atualizar seus dados</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários</li>
            <li>Solicitar a portabilidade dos dados</li>
            <li>Revogar o consentimento a qualquer momento</li>
          </ul>
          <p>Para exercer seus direitos, entre em contato pelo e-mail <a href="mailto:contato@whodo.com.br">contato@whodo.com.br</a>.</p>
        </>
      ),
    },
    {
      title: '7. Contato',
      content: (
        <>
          <p>Se tiver dúvidas sobre esta política, entre em contato:</p>
          <p><strong>Whodo Group LTDA</strong><br />CNPJ: 59.704.711/0001-90<br />E-mail: <a href="mailto:contato@whodo.com.br">contato@whodo.com.br</a></p>
        </>
      ),
    },
  ],
};

const dataDeletionContent = {
  title: 'Exclusão de Dados',
  description: 'Saiba como solicitar a exclusão dos seus dados pessoais na plataforma Whodo.',
  updatedAt: '6 de março de 2026',
  sections: [
    {
      title: '1. Como Solicitar a Exclusão',
      content: (
        <>
          <p>Você pode solicitar a exclusão dos seus dados pessoais a qualquer momento enviando um e-mail para <a href="mailto:contato@whodo.com.br">contato@whodo.com.br</a> com o assunto "Exclusão de Dados". Na sua solicitação, inclua:</p>
          <ul>
            <li>Nome completo</li>
            <li>E-mail associado à sua conta</li>
            <li>Descrição dos dados que deseja excluir (ou se deseja a exclusão completa)</li>
          </ul>
        </>
      ),
    },
    {
      title: '2. Dados Excluídos',
      content: (
        <>
          <p>Ao solicitar a exclusão completa, os seguintes dados serão removidos:</p>
          <ul>
            <li>Informações de perfil (nome, e-mail, avatar)</li>
            <li>Dados de autenticação e tokens de acesso</li>
            <li>Histórico de interações e preferências</li>
            <li>Dados obtidos via integração com Instagram/Meta</li>
          </ul>
          <p>Alguns dados podem ser retidos quando exigido por obrigação legal ou regulatória, pelo período mínimo necessário.</p>
        </>
      ),
    },
    {
      title: '3. Prazo de Processamento',
      content: (
        <p>As solicitações de exclusão são processadas em até <strong>30 (trinta) dias úteis</strong> a partir do recebimento. Você receberá uma confirmação por e-mail quando o processo for concluído.</p>
      ),
    },
    {
      title: '4. Contato',
      content: (
        <>
          <p>Para dúvidas sobre a exclusão de dados:</p>
          <p><strong>Whodo Group LTDA</strong><br />CNPJ: 59.704.711/0001-90<br />E-mail: <a href="mailto:contato@whodo.com.br">contato@whodo.com.br</a></p>
        </>
      ),
    },
  ],
};

export default function Legal() {
  const { pathname } = useLocation();
  const isPrivacy = pathname === '/privacidade';
  const content = isPrivacy ? privacyContent : dataDeletionContent;
  const canonicalPath = isPrivacy ? '/privacidade' : '/exclusao-dados';

  return (
    <div className="legal-page">
      <Helmet>
        <title>{content.title} | Whodo</title>
        <meta name="description" content={content.description} />
        <link rel="canonical" href={`https://whodo.com.br${canonicalPath}`} />
        <meta property="og:title" content={`${content.title} | Whodo`} />
        <meta property="og:description" content={content.description} />
        <meta property="og:url" content={`https://whodo.com.br${canonicalPath}`} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="pt_BR" />
      </Helmet>

      <Header />

      <article className="legal-article">
        <h1 className="legal-title">{content.title}</h1>
        <p className="legal-subtitle">Última atualização: {content.updatedAt}</p>

        {content.sections.map((section) => (
          <section key={section.title} className="legal-section">
            <h2>{section.title}</h2>
            {section.content}
          </section>
        ))}
      </article>

      <footer className="legal-footer">
        <div className="footer-container">
          <div className="footer-content">
            <Link to="/" className="footer-brand-link">whodo</Link>
            <div className="footer-links">
              <Link to="/privacidade">Privacidade</Link>
              <span>|</span>
              <Link to="/exclusao-dados">Exclusão de Dados</Link>
            </div>
            <a href="https://wa.me/5516999493490" target="_blank" rel="noopener noreferrer" className="footer-whatsapp">WhatsApp</a>
            <p>&copy; {new Date().getFullYear()} Whodo Group LTDA - CNPJ 59.704.711/0001-90</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
