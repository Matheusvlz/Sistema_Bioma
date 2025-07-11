import React, { useState, useEffect, useRef } from 'react';

import { invoke } from '@tauri-apps/api/core';
import { User, Palette, MoonStar, Settings as SettingsIcon, Save } from 'lucide-react'; // Adicionado Save icon

// Define a interface do Usuário com base na sua struct Rust
interface Usuario {
  success: boolean;
  id: number;
  nome: string;
  privilegio: string;
  empresa?: string;
  ativo: boolean;
  nome_completo: string;
  cargo: string;
  numero_doc: string;
  profile_photo?: string; // Pode ser opcional, pois o backend pode enviar null
  dark_mode: boolean; // Adicionado
}

export const Settings: React.FC = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null); // Mensagem de sucesso/erro ao salvar

  // Estado para a URL da imagem de perfil (Data URL para pré-visualização ou URL completo do servidor)
  const [profileImage, setProfileImage] = useState<string | null>(null);
  // Estado para a cor de fundo, padrão um branco suave
  const [backgroundColor, setBackgroundColor] = useState(() => localStorage.getItem('appBackgroundColor') || '#f8fafc');
  // Estado para o modo escuro
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('appDarkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Ref para o input de arquivo para resetar
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Estado para armazenar o arquivo de imagem selecionado antes de salvar
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Efeito para buscar as informações do usuário ao carregar o componente
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user: Usuario | null = await invoke('usuario_logado');
        if (user) {
          setUsuario(user);
          // Constrói o URL completo da foto de perfil
          // Certifique-se de que `import.meta.env.VITE_API_URL` está configurado no seu frontend
          const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.15.26:8082'; // Usando a URL que você confirmou
          const fullProfilePhotoUrl = user.profile_photo ? `${apiUrl}${user.profile_photo}` : 'https://placehold.co/150x150/065f46/ffffff?text=User';
          setProfileImage(fullProfilePhotoUrl);
          setIsDarkMode(user.dark_mode); // Define o modo escuro a partir do usuário logado
        } else {
          setError('Usuário não autenticado.');
        }
      } catch (err) {
        console.error('Erro ao buscar usuário:', err);
        setError(`Erro ao carregar dados do usuário: ${err}`);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Efeito para aplicar a cor de fundo e o modo escuro ao corpo do documento e salvar no localStorage
  useEffect(() => {
    document.body.style.backgroundColor = backgroundColor;
    localStorage.setItem('appBackgroundColor', backgroundColor);

    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('appDarkMode', JSON.stringify(isDarkMode));

    return () => {
      document.body.style.backgroundColor = '';
      document.body.classList.remove('dark-mode');
    };
  }, [backgroundColor, isDarkMode]);

  // Lida com a mudança da foto de perfil para pré-visualização
  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file); // Armazena o arquivo para ser enviado no save
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string); // Define a imagem como um Data URL para pré-visualização
      };
      reader.readAsDataURL(file);
    }
  };

  // Lida com a mudança da cor de fundo
  const handleBackgroundColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBackgroundColor(event.target.value);
  };

  // Alterna o modo escuro
  const toggleDarkMode = () => {
    setIsDarkMode((prev: boolean) => !prev); // Corrigido: tipagem explícita para 'prev'
  };

  // Função para salvar as alterações
  const handleSaveChanges = async () => {
    if (!usuario) {
      setSaveMessage('Erro: Usuário não carregado.');
      return;
    }

    setLoading(true);
    setSaveMessage(null);

    let base64Image: string | null | undefined = undefined; // Use undefined por padrão para não enviar se não houver mudança
    if (selectedFile) {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      base64Image = await new Promise<string | null>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
      });

      if (base64Image === null) { // Se houve erro na leitura do arquivo
        setSaveMessage('Erro ao ler o arquivo de imagem.');
        setLoading(false);
        return;
      }
    } else if (profileImage === 'https://placehold.co/150x150/065f46/ffffff?text=User' && usuario.profile_photo) {
      // Se a imagem atual é o placeholder e o usuário tinha uma foto, significa que a foto foi "removida"
      base64Image = null; // Envia null para limpar a foto no backend
    } else if (profileImage && !profileImage.startsWith('data:') && usuario.profile_photo && profileImage === `${import.meta.env.VITE_API_URL || 'http://192.168.15.26:8082'}${usuario.profile_photo}`) {
      // Se a imagem atual é a mesma que veio do backend (não é um Data URL novo), não envia nada
      base64Image = undefined;
    }


    try {
      // Chama o novo comando Tauri para atualizar as configurações do usuário
      const success: boolean = await invoke('update_user_settings', {
        userId: usuario.id,
        profilePhotoBase64: base64Image, // Pode ser string (Data URL), null, ou undefined
        backgroundColor: backgroundColor, // Enviado, mas não persistido no backend (apenas no localStorage)
        isDarkMode: isDarkMode,
      });

      if (success) {
        setSaveMessage('Configurações salvas com sucesso!');
        // Re-busque o usuário para obter o caminho da foto atualizado da API
        const updatedUser: Usuario | null = await invoke('usuario_logado');
        if (updatedUser) {
          setUsuario(updatedUser);
          const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.15.26:8082';
          const fullProfilePhotoUrl = updatedUser.profile_photo ? `${apiUrl}${updatedUser.profile_photo}` : 'https://placehold.co/150x150/065f46/ffffff?text=User';
          setProfileImage(fullProfilePhotoUrl);
          setIsDarkMode(updatedUser.dark_mode); // Atualiza o modo escuro com o valor do backend
        }

        setSelectedFile(null); // Limpa o arquivo selecionado após salvar
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Limpa o input de arquivo
        }
      } else {
        setSaveMessage('Falha ao salvar as configurações.');
      }
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setSaveMessage(`Erro ao salvar: ${err}`);
    } finally {
      setLoading(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };


  // Estilos reutilizáveis para os cartões de seção
  const cardStyle: React.CSSProperties = {
    background: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
    marginBottom: '1.5rem',
    border: '1px solid #e0e7e9', // Borda sutil
  };

  // Estilos para os títulos das seções
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.4rem',
    fontWeight: '600',
    color: '#166534', // Verde escuro para títulos
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  };

  // Estilos para o botão de alternar (toggle switch)
  const toggleSwitchStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  };

  const switchInputStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: '60px',
    height: '34px',
  };

  const sliderStyle: React.CSSProperties = {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: isDarkMode ? '#22c55e' : '#ccc', // Verde quando ativado, cinza quando desativado
    transition: '.4s',
    borderRadius: '34px',
  };

  const sliderBeforeStyle: React.CSSProperties = {
    position: 'absolute',
    content: '""',
    height: '26px',
    width: '26px',
    left: isDarkMode ? '29px' : '4px',
    bottom: '4px',
    backgroundColor: 'white',
    transition: '.4s',
    borderRadius: '50%',
  };

  const saveButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: '#166534', // Verde escuro para o botão de salvar
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: '600',
    transition: 'background-color 0.2s ease-in-out, transform 0.1s ease-in-out',
    width: '100%',
    marginTop: '2rem',
  };

  const saveButtonHoverStyle: React.CSSProperties = {
    backgroundColor: '#104e2a', // Verde mais escuro no hover
    transform: 'translateY(-2px)',
  };

  return (

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ margin: '0 0 2rem 0', fontSize: '2.5rem', fontWeight: '700', color: '#166534' }}>
          Configurações do Usuário
        </h1>

        {loading && <p>Carregando informações do usuário...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {saveMessage && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            backgroundColor: saveMessage.includes('sucesso') ? '#dcfce7' : '#fee2e2',
            color: saveMessage.includes('sucesso') ? '#166534' : '#b91c1c',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            {saveMessage}
          </div>
        )}

        {usuario && (
          <>
            {/* Seção: Informações do Perfil */}
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                <User size={24} />
                Informações do Perfil
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #22c55e', // Borda verde vibrante
                  flexShrink: 0,
                }}>
                  <img
                    src={profileImage || 'https://placehold.co/120x120/d1d5db/4b5563?text=User'}
                    alt="Foto de Perfil"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>
                    {usuario.nome_completo}
                  </h3>
                  <p style={{ color: '#4b5563', margin: '0.0rem 0' }}>
                    **Cargo:** {usuario.cargo}
                  </p>
                  <p style={{ color: '#4b5563', margin: '0.0rem 0' }}>
                    **Privilégio:** {usuario.privilegio}
                  </p>
                  {usuario.empresa && (
                    <p style={{ color: '#4b5563', margin: '0.0rem 0' }}>
                      **Empresa:** {usuario.empresa}
                    </p>
                  )}
                </div>
              </div>
              <label htmlFor="profile-upload" style={{
                display: 'block',
                backgroundColor: '#22c55e', // Botão verde
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                fontWeight: '600',
                transition: 'background-color 0.2s ease-in-out',
                marginTop: '1rem',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#22c55e')}
              >
                Alterar Foto de Perfil
              </label>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                style={{ display: 'none' }} // Esconde o input de arquivo padrão
                ref={fileInputRef} // Adiciona a ref ao input
              />
            </div>

            {/* Seção: Configurações de Aparência */}
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                <Palette size={24} />
                Aparência
              </h2>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="background-color" style={{ display: 'block', color: '#374151', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Cor de Fundo:
                </label>
                <input
                  type="color"
                  id="background-color"
                  value={backgroundColor}
                  onChange={handleBackgroundColorChange}
                  style={{ width: '100%', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                />
              </div>

              <div style={toggleSwitchStyle}>
                <MoonStar size={20} color={isDarkMode ? '#166534' : '#6b7280'} />
                <span style={{ color: '#374151', fontWeight: '500' }}>Modo Escuro:</span>
                <label style={switchInputStyle}>
                  <input
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={toggleDarkMode}
                    style={{ opacity: 0, width: 0, height: 0 }} // Esconde o checkbox padrão
                  />
                  <span style={sliderStyle}>
                    <span style={sliderBeforeStyle}></span>
                  </span>
                </label>
              </div>
            </div>

            {/* Seção: Outras Configurações (Placeholder) */}
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                <SettingsIcon size={24} />
                Outras Configurações
              </h2>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Esta seção pode ser expandida com mais opções no futuro, como notificações ou privacidade.
              </p>
            </div>

            {/* Botão Salvar Alterações */}
            <button
              onClick={handleSaveChanges}
              style={saveButtonStyle}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, saveButtonHoverStyle);
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, saveButtonStyle);
              }}
              disabled={loading} // Desabilita o botão enquanto estiver salvando
            >
              {loading ? 'Salvando...' : (
                <>
                  <Save size={20} />
                  Salvar Alterações
                </>
              )}
            </button>
          </>
        )}
      </div>
  
  );
};
