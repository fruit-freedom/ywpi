import { Box, Divider, Stack, styled, Tooltip, Typography } from "@mui/material"
import { Doc, Document } from "./types"
import { useEffect, useState } from "react";

// const names = [
// [
//     'Способ обнаружения обучающих данных для машинного обучения компьютерной системы промышленного интернета вещей с питанием от перезаряжаемой батареи',
//     'Система и способ машинного обучения модели обнаружения вредоносных файлов',
//     'Способ определения оптической силы интраокулярной линзы с использованием искусственной нейронной сети',
//     'МАШИННОЕ ОБУЧЕНИЕ',
//     'Способ оценки качества телерентгенологических снимков',
//     'РАСПРЕДЕЛЁННОЕ ОБУЧЕНИЕ МОДЕЛЕЙ МАШИННОГО ОБУЧЕНИЯ ДЛЯ ПЕРСОНАЛИЗАЦИИ',
//     'МАШИННОЕ ОБУЧЕНИЕ В ТЕРМОЯДЕРНЫХ РЕАКТОРАХ',
//     'СПОСОБ ПОИСКА ДАННЫХ ДЛЯ ЗАДАЧ МАШИННОГО ОБУЧЕНИЯ',
//     'КЛАССИФИКАЦИЯ ОКРУЖАЮЩЕГО ЗВУКА ТРАНСПОРТНОГО СРЕДСТВА ЧЕРЕЗ МАШИННОЕ ОБУЧЕНИЕ НА ОСНОВЕ НЕЙРОННЫХ СЕТЕЙ',
// ],
// [
//     'УСТАНОВКА НАПРАВЛЕННОГО ГОРИЗОНТАЛЬНОГО БУРЕНИЯ',
//     'Способ разработки нефтегазоконденсатных месторождений',
//     'Способ разработки нефтегазоконденсатных месторождений',
//     'БУРИЛЬНЫЙ ИНСТРУМЕНТ, ИСПОЛЬЗУЕМЫЙ ПРИ ГОРИЗОНТАЛЬНОМ БУРЕНИИ',
//     'СПОСОБ БУРЕНИЯ РАЗВЕТВЛЕННЫХ СТВОЛОВ В ГОРИЗОНТАЛЬНОЙ СКВАЖИНЕ',
//     'СПОСОБ РАЗРАБОТКИ НЕФТЯНЫХ ЗАЛЕЖЕЙ',
//     'Способ бурения горизонтальной скважины',
//     'УСТАНОВКА НАПРАВЛЕННОГО ГОРИЗОНТАЛЬНОГО БУРЕНИЯ',
//     'Способ бурения горизонтальной скважины',
//     'Буровая установка горизонтального бурения',
// ],
// [
//     'БЕСПИЛОТНЫЙ ЛЕТАТЕЛЬНЫЙ АППАРАТ ДЛЯ МОНИТОРИНГА СЕЛЬСКОХОЗЯЙСТВЕННЫХ УГОДИЙ',
//     'АВИАБАЙК',
//     'Малогабаритное бортовое радиоэлектронное устройство для управления пилотажно-навигационным комплексом беспилотного летательного аппарата',
//     'БПЛА вертикального взлета и посадки',
//     'БПЛА из унифицированных деталей и узлов, изготовленных методом литья под давлением, и способ его изготовления',
//     'КОРАБЕЛЬНОЕ ВЗЛЕТНО-ПОСАДОЧНОЕ УСТРОЙСТВО ДЛЯ БЕСПИЛОТНЫХ ЛЕТАТЕЛЬНЫХ АППАРАТОВ САМОЛЕТНОГО ТИПА МАЛОЙ И СРЕДНЕЙ ДАЛЬНОСТИ',
//     'КОМПЛЕКС РАСПРЕДЕЛЕННОГО УПРАВЛЕНИЯ ИНТЕЛЛЕКТУАЛЬНЫМИ РОБОТАМИ ДЛЯ БОРЬБЫ С МАЛОГАБАРИТНЫМИ БЕСПИЛОТНЫМИ ЛЕТАТЕЛЬНЫМИ АППАРАТАМИ',
//     'Устройство для установки птицезащитных устройств на провод ВЛ',
//     'Гибридная силовая установка беспилотного летательного аппарата',
//     'БЕСПИЛОТНЫЙ ЛЕТАТЕЛЬНЫЙ АППАРАТ',
// ],
// ]

const Secondary = styled(Typography)({
    color: '#0000004f',
    fontSize: '0.675rem'
})

const DocumentCell = ({ doc, index }: { doc: Doc, index: number }) => {
    const [data, setData] = useState<Document>();

    useEffect(() => {
        fetch(`/repository/api/v1/documents/${doc.id}`)
        .then(e => e.json())
        .then(e => setData(e))
    }, []);

    return (
        <Box>
            <Divider />
            <Stack padding={'0.2em'}>
                <Stack gap={2} direction={'row'}>
                    <Typography color={'#0000004f'} fontWeight={600} fontSize={'0.675rem'} variant='body2'>{index}</Typography>
                    <Typography
                        variant='body2'
                        fontSize={'0.675rem'}
                        color={'#0000004f'}
                        sx={{
                            border: '1px solid #0000001f',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        width={'min-content'}
                    >
                        {doc.id}
                    </Typography>
                    <Typography color={'#0000004f'} fontWeight={600} fontSize={'0.675rem'} variant='body2'>{doc.score.toFixed(3)}</Typography>
                </Stack>
                <Typography fontWeight={500}>{data?.name}</Typography>
                <Stack sx={{ cursor: 'default' }}>
                    {
                        doc.explain?.keywords?.length
                        ?
                        <Stack direction={'row'} flexWrap={'wrap'} gap={0.5}>
                            <Secondary variant='body1'>kw: </Secondary>
                            {
                                doc.explain?.keywords.map(e => <Secondary variant='body1' dangerouslySetInnerHTML={{ __html: e}} />)
                            }
                        </Stack>
                        :
                        null
                    }
                    {
                        doc.explain?.activities?.length
                        ?
                        <Stack direction={'row'} flexWrap={'wrap'} gap={0.5}>
                            <Secondary variant='body1'>a: </Secondary>
                            {
                                doc.explain?.activities.map(e => <Secondary variant='body1' dangerouslySetInnerHTML={{ __html: e}} />)
                            }
                        </Stack>
                        :
                        null
                    }
                    {
                        doc.explain?.name?.length
                        ?
                        <Stack direction={'row'} flexWrap={'wrap'} gap={0.5}>
                            <Secondary variant='body1'>n: </Secondary>
                            {
                                doc.explain?.name.map(e => <Secondary variant='body1' dangerouslySetInnerHTML={{ __html: e}} />)
                            }
                        </Stack>
                        :
                        null
                    }
                    {/* <Tooltip placement='left' title={'Name embedding vector distance'}>
                        <Typography color={'#0000004f'} fontSize={'0.675rem'} variant='body2'>ne: 0.78</Typography>
                    </Tooltip> */}
                </Stack>
            </Stack>
        </Box>
    )
}

export const DocumentsColumn = ({ docs }: { docs: Doc[] }) => {
    return (
        <Stack
            gap={1}
            sx={{
                'em': {
                    textDecoration: 'underline',
                    fontStyle: 'normal'
                }
            }}
        >
            {
                docs.map((d, idx) => <DocumentCell key={d.id} doc={d} index={idx + 1} />)
            }
        </Stack>
    )
}
