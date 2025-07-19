import { Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const interpretationByOpenCount = [
    '', // Índice 0 vazio
    'Início, liderança, masculino.', // 1 búzio aberto
    'Dualidade, feminino, cuidado, zelo.', // 2 búzios abertos
    'Comunicação, conexão, família.', // 3 búzios abertos
    'Material, estabilidade, dinheiro.', // 4 búzios abertos
    'Liberdade, objetivos, missão.', // 5 búzios abertos
    'Espiritual, mente, sabedoria.', // 6 búzios abertos
    'Portais, divindades, planos superiores.', // 7 búzios abertos
    'Universo, oculto, mistério.', // 8 búzios abertos
    'Ciclos, morte, vida, renascimento.', // 9 búzios abertos
    'Conclusão, perfeição, belo, harmônico.', // 10 búzios abertos
    'Sombra, segredos, aceitação, você + você.', // 11 búzios abertos
    'Amor, paixão, sedução, atração.', // 12 búzios abertos
    'Magia, iniciação, sacerdócio.', // 13 búzios abertos
];

const whiteBuzioMeaning = {
    WhiteOpend: 'Búzio branco: Aberto → positivo',
    WhiteClosed: 'Búzio branco: Fechado → negativo',
};

const coinMeaning = {
    CentCoin: 'Um problema de natureza material.',
    TailsCoin: 'Um problema de natureza espiritual.',
};

const Interpretacao = ({ results }) => {
    const theme = useTheme();

    // ESSA É A LINHA CRÍTICA PARA RESOLVER O ERRO
    // Se 'results' for nulo ou indefinido, o componente simplesmente não renderiza nada.
    // Isso evita o "Cannot read properties of undefined (reading 'buzios')".
    if (!results) {
        return null;
    }

    // A partir daqui, 'results' tem garantia de ser um objeto (pelo menos não null/undefined).
    // O resto do seu código pode assumir que 'results' existe.
    const openBuziosCount = results.buzios.filter(estado => estado === 'opend').length;
    const mainInterpretation = interpretationByOpenCount[openBuziosCount];

    const whiteMeaning = whiteBuzioMeaning[results.whiteBuzio];
    const currentCoinMeaning = coinMeaning[results.coin];

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            sx={{
                mt: 6,
                p: 4,
                backgroundColor: 'rgba(10, 4, 16, 0.9)',
                borderRadius: 2,
                maxWidth: '800px',
                mx: 'auto',
                border: `1px solid ${theme.palette.secondary.main}`,
                boxShadow: `0 0 15px ${theme.palette.secondary.main}80`,
                color: theme.palette.text.primary,
            }}
        >
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 'bold',
                    mb: 3,
                    color: theme.palette.secondary.main,
                    fontFamily: theme.typography.h1.fontFamily,
                    textAlign: 'center'
                }}
            >
                Interpretação da Jogada
            </Typography>

            {/* Interpretação Principal - Baseada na quantidade de búzios abertos */}
            <Box sx={{ mb: 4, p: 2, borderRadius: 1, backgroundColor: 'rgba(255, 215, 0, 0.1)', borderLeft: `3px solid ${theme.palette.secondary.main}` }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                    Quantidade de Búzios Africanos Abertos: {openBuziosCount}
                </Typography>
                <Typography variant="body1">
                    **Interpretação:** {mainInterpretation || 'Nenhuma interpretação direta para essa quantidade de búzios abertos.'}
                </Typography>
            </Box>

            {/* Búzio Branco */}
            {whiteMeaning && (
                <Box sx={{
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: `1px solid ${results.whiteBuzio === 'WhiteOpend'
                        ? theme.palette.secondary.main
                        : theme.palette.error ? theme.palette.error.main : 'red'}`,
                    mb: 4,
                }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                        Búzio Branco:
                    </Typography>
                    <Typography>
                        {whiteMeaning}
                    </Typography>
                </Box>
            )}

            {/* Moeda */}
            {currentCoinMeaning && (
                <Box sx={{ p: 2, borderRadius: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                        Moeda:
                    </Typography>
                    <Typography sx={{ fontStyle: 'italic', color: theme.palette.text }}>
                        {currentCoinMeaning}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default Interpretacao;