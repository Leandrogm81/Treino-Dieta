
import React, { useState } from 'react';
import type { User } from '../types';
import { Card, Input, Button, Modal } from './ui';

interface AuthFormProps {
    title: string;
    buttonText: string;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    children: React.ReactNode;
    error?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ title, buttonText, onSubmit, children, error }) => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-center text-primary mb-6">{title}</h1>
            <form onSubmit={onSubmit} className="space-y-4">
                {children}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" className="w-full">{buttonText}</Button>
            </form>
        </Card>
    </div>
);

const AdminSetupForm: React.FC<{ createAdmin: (u: string, p: string) => Promise<boolean> }> = ({ createAdmin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        if (!username || !password) {
            setError('Preencha todos os campos.');
            return;
        }
        await createAdmin(username, password);
    };

    return (
        <AuthForm title="Configuração Inicial" buttonText="Criar Administrador" onSubmit={handleSubmit} error={error}>
            <p className="text-center text-text-secondary mb-4">Bem-vindo! Crie a primeira conta de administrador.</p>
            <Input label="Usuário Admin" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </AuthForm>
    );
};

const ForgotPasswordModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    
    const handleMasterReset = () => {
        if (window.confirm(
            'ATENÇÃO: Esta ação é irreversível e apagará TODOS os dados do aplicativo, incluindo usuários, treinos, dietas e progressos.\n\n' +
            'Use esta opção apenas se você for o administrador e esqueceu sua senha.\n\n' +
            'Deseja continuar e apagar tudo para reconfigurar o aplicativo?'
        )) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Recuperar Acesso">
            <div className="space-y-4 text-text-secondary">
                <p>
                    Se você é um usuário comum e esqueceu sua senha, por favor, entre em contato com o administrador do sistema para que ele possa redefinir sua senha para você.
                </p>
                <div className="border-t border-border pt-4 mt-4">
                    <h3 className="font-bold text-text-primary mb-2">Opção de Administrador</h3>
                    <p className="mb-4">
                        Se você é o administrador e perdeu o acesso, a única forma de recuperação é resetar completamente a aplicação. Isso apagará todos os dados de todos os usuários.
                    </p>
                    <Button variant="danger" className="w-full" onClick={handleMasterReset}>
                        Apagar Todos os Dados e Reconfigurar
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

const LoginForm: React.FC<{ login: (u: string, p: string) => Promise<boolean> }> = ({ login }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        const success = await login(username, password);
        if (!success) {
            setError('Usuário ou senha inválidos.');
        }
    };
    return (
        <>
            <AuthForm title="Login" buttonText="Entrar" onSubmit={handleSubmit} error={error}>
                <Input label="Usuário" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                <div className="text-right -mt-2">
                    <button type="button" onClick={() => setIsForgotPasswordOpen(true)} className="text-sm text-secondary hover:underline focus:outline-none">
                        Esqueceu a senha?
                    </button>
                </div>
            </AuthForm>
            <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} />
        </>
    );
};

const ChangePasswordForm: React.FC<{ changePassword: (p: string) => Promise<boolean>, currentUser: User }> = ({ changePassword, currentUser }) => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 4) {
             setError('A senha deve ter pelo menos 4 caracteres.');
            return;
        }
        await changePassword(password);
    };

    return (
        <AuthForm title="Alterar Senha" buttonText="Salvar Nova Senha" onSubmit={handleSubmit} error={error}>
            <p className="text-center text-text-secondary mb-4">Olá, {currentUser.username}. Por segurança, defina uma nova senha.</p>
            <Input label="Nova Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <Input label="Confirmar Nova Senha" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
        </AuthForm>
    );
};

export const ChangeOwnPasswordModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    changeOwnPassword: (current: string, newP: string) => Promise<{ success: boolean; message: string; }>;
}> = ({ isOpen, onClose, changeOwnPassword }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const doSubmit = async () => {
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('As novas senhas não coincidem.');
            return;
        }
        if (newPassword.length < 4) {
            setError('A nova senha deve ter pelo menos 4 caracteres.');
            return;
        }

        const result = await changeOwnPassword(currentPassword, newPassword);
        if (result.success) {
            setSuccess(result.message);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(handleClose, 2000);
        } else {
            setError(result.message);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        doSubmit();
    };
    
    const handleClose = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
        onClose();
    }

    const modalFooter = (
        <div className="flex justify-end gap-4">
            <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
            <Button onClick={doSubmit}>Salvar Alterações</Button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Alterar Minha Senha" footer={modalFooter}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Senha Atual" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required autoFocus />
                <Input label="Nova Senha" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                <Input label="Confirmar Nova Senha" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-500 text-sm">{success}</p>}
            </form>
        </Modal>
    );
};

interface AuthViewProps {
    mode: 'ADMIN_SETUP' | 'LOGIN' | 'CHANGE_PASSWORD';
    createAdmin?: (u: string, p: string) => Promise<boolean>;
    login?: (u: string, p: string) => Promise<boolean>;
    changePassword?: (p: string) => Promise<boolean>;
    currentUser?: User;
}

export const AuthView: React.FC<AuthViewProps> = ({ mode, ...props }) => {
    switch(mode) {
        case 'ADMIN_SETUP':
            return <AdminSetupForm createAdmin={props.createAdmin!} />;
        case 'LOGIN':
            return <LoginForm login={props.login!} />;
        case 'CHANGE_PASSWORD':
            return <ChangePasswordForm changePassword={props.changePassword!} currentUser={props.currentUser!} />;
        default:
            return null;
    }
}
