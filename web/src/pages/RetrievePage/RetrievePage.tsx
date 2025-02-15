import { Stack, Typography, Box, Paper, styled, Autocomplete, TextField, Divider, Modal } from "@mui/material"
import React, { SyntheticEvent, useEffect, useLayoutEffect, useState } from "react"
import { useAgents } from "../../store/store";
import { AgentStatus, Method, useEvents } from "../../hooks/useEvents";
import { Doc, Org, Organization } from "./types";
import { DocumentsColumn } from "./Column";

const Label = styled(Typography)({
    backgroundColor: '#e7e7e7',
    borderRadius: '8px',
    padding: '0 0.5em',
    width: 'max-content',
    fontSize: '12px'
})


const IDLabel = styled(Typography)({
    backgroundColor: '#e9e9e9',
    borderRadius: '4px',
    width: 'min-content',
    padding: '0 0.3em',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer'
})

const DocumentCard = ({ index, doc }: { doc: Doc, index?: number }) => {
    const [data, setData] = useState<Document>();

    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetch(`/repository/api/v1/documents/${doc.id}`)
        .then(e => e.json())
        .then(e => setData(e))
    }, []);

    return (
        <Paper
            sx={{
                'em': {
                    backgroundColor: 'yellow',
                    fontStyle: 'normal'
                },
                cursor: 'pointer',
                '&:hover': {
                    transform: 'scale(1.01)'
                }
            }}
            onClick={() => setOpen(true)}
            elevation={3}
        >
            <Stack padding={'1em'} gap={1}>
                <Stack direction={'row'} justifyContent={'space-between'}>
                    <Typography variant="body2">{index}</Typography>
                    <IDLabel variant='caption'>{doc.id}</IDLabel>
                    <Typography variant="body2" fontWeight={700}>{doc.score.toFixed(2)}</Typography>
                </Stack>
                <Box>
                    <Typography variant='body2' fontWeight={700}>{ data?.name }</Typography>
                </Box>
                <Divider />
                <Stack
                    gap={1}
                    sx={{
                        outline: '2px dashed #e7e710',
                        outlineOffset: '2px'
                    }}
                >
                    {
                        doc.explain && doc.explain.name.length > 0
                        ?
                        <Typography variant='body2' fontWeight={700} dangerouslySetInnerHTML={{ __html: doc.explain.name }} />
                        :
                        null
                    }
                    <Stack gap={0.5} direction={'row'} flexWrap={'wrap'}>
                        {
                            doc.explain?.activities.map(e => <Label key={e} dangerouslySetInnerHTML={{ __html: e }}></Label>)
                        }
                    </Stack>
                    <Stack gap={0.5} direction={'row'} flexWrap={'wrap'}>
                        {
                            doc.explain?.keywords.map(e => <Label key={e} dangerouslySetInnerHTML={{ __html: e }}></Label>)
                        }
                    </Stack>
                    <Stack>
                        {
                            doc.explain?.claims.map(e => <Typography>{e}</Typography>)
                        }
                    </Stack>
                </Stack>
            </Stack>
            {/* <Modal open={open} onClose={() => setOpen(false)}>
                <Stack>
                    Hello
                </Stack>
            </Modal> */}
        </Paper>
    );
}

const OrganizationCard = ({ org }: { org: Org, index: number }) => {
    const [data, setData] = useState<Organization>();

    useEffect(() => {
        fetch(`/repository/api/v1/organizations/${org.id}`)
        .then(e => e.json())
        .then(e => setData(e))
    }, []);


    return (
        <Paper
            sx={{
                'em': {
                    backgroundColor: 'yellow',
                    fontStyle: 'normal'
                },
                backgroundColor: '#f0f0f0',
            }}
        >
            <Stack padding={2} gap={1.5}>
                <Typography variant='body2' >
                    {
                        data?.name
                    }
                </Typography>
            </Stack>
        </Paper>
    );
}

const QueryLabel = styled(Label)({
    backgroundColor: 'pink',
    cursor: 'pointer',
    '&:hover': {
        backgroundColor: '#efa0ae'
    },
    maxWidth: '400px',
    textWrap: 'wrap',
    height: 'max-content'
})

const QueryCloud = ({ onChoose }: { onChoose: (q: string) => void; }) => {
    const queries = [
        'learning',
        'переработка нефти',
        'вакуумные фильтры',
        'Автоматизация процесса поверки преобразователей давления измерительных каналов печей',
        'Система видеоаналитики',
        'ТП 5.6. Комплекс технологий повышения противокоррозионной защиты объектов газотранспортной системы',
        'Разработка высокотемпературных цементов для наклейки высокотемпературных тензорезисторов в диапазоне 500-1300 ºС',
        'Разработка и изготовление перспективной резиновой смеси с расширенным диапазоном рабочих температур и давлений',
        `Цель: разработка и внедрение технологии контроля «просечек» на ДСЕ типа «Кольцо» и «Корпус» с использованием КИМ.
            Разработка и внедрение технологии измерения геометрических параметров перфорационных отверстий в лопатках турбины
            с использованием КИМ.

            Задача: разработать и внедрить технологию контроля параметров «просечек» и перфорационных отверстий.

            Объект: технологии контроля, измерительные программы для КИМ.

            Требования: технология контроля параметров должна быть применима для КИМ схожей конфигурации независимо от используемого управляющего ПО. Результаты измерений должны обеспечивать сходимость результатов в 30% от поля допуска на параметр независимо от применяемого СИ.
        `,
        'Повышения нефтеотдачи пласта',
        'СПЕЦУСТРОЙСТВО ВОЗДУХОЗАБОРНИКА С ПРОТИВООБЛЕДЕНИТЕЛЬНОЙ СИСТЕМОЙ',
        'горизонтальное бурение'
    ];

    return (
        <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
            {
                queries.map(e => <QueryLabel onClick={() => onChoose(e)} >{e}</QueryLabel>)
            }
        </Stack>
    )
}

interface RetrieveMethod {
    agentId: string;
    methodName: string;
    isDoc: boolean;
}

interface RetrieveMethodCardProps extends RetrieveMethod {
    query: string | null;
}

interface RetrieveTask {
    __others__: Doc[];
}

const RetrieveMethodColumn = ({ agentId, methodName, query, isDoc } : RetrieveMethodCardProps) => {
    const [data, setData] = useState<RetrieveTask>();

    useLayoutEffect(() => {
        if (query === null || query.length <= 0)
            return;
        console.log('useLayoutEffect')
        fetch('/api/run_task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agent_id: agentId,
                method: methodName,
                inputs: {
                    query_string: query
                },
            })
        })
        .then(e => e.json())
        .then(e => setData(e))
        .catch(e => console.log(e))
    }, [query]);

    return (
        <Box>
            <Typography textAlign={'center'} variant='h5'>
                Model <span style={{ fontWeight: 700 }}>{methodName}</span>
            </Typography>
            <Stack gap={0.5} width={'400px'}>
                {
                    data ?
                    (
                        isDoc ?
                        <DocumentsColumn docs={data.__others__} />
                        // data.__others__.map((e, idx) => <DocumentCard index={idx + 1} key={e.id} doc={e} />)
                        :
                        data.__others__.map((e, idx) => <OrganizationCard index={idx + 1} key={e.id} org={e} />)
                    )
                    : null
                }
            </Stack>
        </Box>
    )
}

const isRetrieveDocumentsMethod = (method: Method) => {
    const others = method.outputs.find(e => e.name == '__others__');
    return (!!others && others.type == 'Doc');
}

const isRetrieveOrganizationsMethod = (method: Method) => {
    const others = method.outputs.find(e => e.name == '__others__');
    return (!!others && others.type == 'Org');
}

export const RetrievePage = () => {
    const { agents, activeAgentIndex, activeAgentMethodIndex } = useAgents();
    const { connectionState } = useEvents();

    const [query, setQuery] = useState<string | null>(null);
    const [tmpQuery, setTmpQuery] = useState('')

    const [methods, setMethods] = useState<RetrieveMethod[]>([]);

    const handleChange = (e: SyntheticEvent) => {
        setTmpQuery(e.target.value);
    }

    const handleMethodChange = (agentId: string, method: Method) => {
        const methodIdx = methods.findIndex(e => e.agentId === agentId && e.methodName === method.name);
        if (methodIdx !== -1) {
            const newMethods = [...methods];
            newMethods.splice(methodIdx, 1);
            setMethods(newMethods);
        }
        else {
            setMethods([...methods, { agentId, methodName: method.name, isDoc: isRetrieveDocumentsMethod(method) }]);
        }
    }

    return (
        <Stack
            gap={2}
            padding={'0 3em'}
        >
            <Stack gap={1} direction={'row'} flexWrap={'wrap'}>
                {
                    agents.map(e => 
                        <Paper
                            elevation={e.status === AgentStatus.Connected ? 16 : 1}
                            sx={{
                                backgroundColor: e.status === AgentStatus.Connected ? 'lightgreen' : undefined
                            }}
                        >
                            <Stack
                                gap={1}
                                padding={0.5}
                            >
                                <Stack direction={'row'} gap={0.2}>
                                    <Typography fontWeight={700}>{e.project}</Typography>
                                    /
                                    <Typography fontWeight={700}>{e.name}</Typography>
                                    /
                                    <Typography color="grey">{e.id}</Typography>
                                </Stack>
                                <Stack gap={0.5}>
                                    {
                                        e.methods.filter(e => isRetrieveDocumentsMethod(e) || isRetrieveOrganizationsMethod(e)).map(m =>
                                            <Box
                                                padding={0.1}
                                                bgcolor={'#e5e5e5'}
                                                borderRadius={'4px'}
                                                sx={{
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        bgcolor: 'lightgrey'
                                                    }

                                                }}
                                                onClick={() => handleMethodChange(e.id, m)}
                                            >
                                                {m.name}
                                            </Box>
                                        )
                                    }
                                </Stack>
                            </Stack>
                        </Paper>
                    )
                }
            </Stack>            
            <QueryCloud
                onChoose={e => {
                    setTmpQuery(e);
                    setQuery(e);
                }}
            />
            <TextField
                label="Query"
                variant="standard"
                value={tmpQuery}
                onChange={handleChange}
                maxRows={10}
                fullWidth
                onKeyDown={e => {
                    if (e.key === "Enter" && tmpQuery.length > 0) {
                        console.log('asasf')
                        setQuery(tmpQuery);
                    }
                }}
                sx={{
                    maxWidth: '800px'
                }}
            />
                <Stack direction={'row'} gap={2}>
                    {
                        methods.map(
                            e => <RetrieveMethodColumn
                                    agentId={e.agentId}
                                    methodName={e.methodName}
                                    query={query}
                                    isDoc={e.isDoc}
                                />
                        )
                    }
                </Stack>
        </Stack>
    )
}
