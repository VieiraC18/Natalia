import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Lock, Mail, User, AlertCircle } from 'lucide-react';
import api from '../api';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);

        try {
            await api.post('/api/auth/register.php', {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            setSuccess('Conta criada com sucesso! Aguarde a aprovação do administrador para entrar.');
            setTimeout(() => navigate('/login'), 5000);
        } catch (err: any) {
            console.error('Registration failed:', err);
            setError(err.response?.data?.error || 'Falha ao criar conta. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-xl border border-gray-100">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Criar Conta</h2>
                    <p className="mt-2 text-sm text-gray-600">Junte-se ao MedHub</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center animate-fade-in">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="text-sm text-red-700">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-center animate-fade-in">
                        <AlertCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-green-700">{success}</span>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className="relative">
                            <label htmlFor="name" className="sr-only">Nome Completo</label>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Nome Completo"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="email-address" className="sr-only">Endereço de Email</label>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="password" className="sr-only">Senha</label>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Senha"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="confirmPassword" className="sr-only">Confirmar Senha</label>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Confirmar Senha"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                <UserPlus className="h-5 w-5 text-blue-500 group-hover:text-blue-100" />
                            </span>
                            {loading ? 'Criando Conta...' : 'Cadastrar'}
                        </button>
                    </div>

                    <div className="text-center">
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Já tem uma conta? Faça Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
