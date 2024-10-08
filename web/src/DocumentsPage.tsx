import React, { useState } from "react";
import { Paper, Typography, Box, Chip, Divider, Button, Collapse } from "@mui/material"
import ReactMarkdown from 'react-markdown';
import './styles.css'
import Header from "./Header";

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

// import { Droppable, Draggable, DragDropContext } from "react-beautiful-dnd";
import { v4 as uuidv4 } from 'uuid';

// import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
// import {CSS} from '@dnd-kit/utilities';


const defaultItems = [
    {
        id: '1',
        name: 'Item 1',
    },
    {
        id: '2',
        name: 'Item 2',
    },
    {
        id: '3',
        name: 'Item 3',
    },
    {
        id: '4',
        name: 'Item 4',
    },
]

// function Droppable(props) {
//     const {isOver, setNodeRef} = useDroppable({
//     id: props.id,
//     });
//     const style = {
//         opacity: isOver ? 1 : 0.5,
//         width: '300px',
//         height: '300px',
//         backgroundColor: 'green'
//     };

//     return (
//     <div ref={setNodeRef}>
//         {props.children}
//     </div>
//     );
// }


// function Draggable(props) {
//     const {attributes, listeners, setNodeRef, transform} = useDraggable({
//         id: props.id,
//     });
//     const style = {
//     // Outputs `translate3d(x, y, 0)`
//         transform: CSS.Translate.toString(transform),
//     };

//     return (
//         <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
//             <Paper sx={{ padding: '1em', margin: '1em' }}>
//                 <Typography variant='h6'>{props.name}</Typography>
//                 <Typography variant='body2' color={'grey'}>Some very very long text</Typography>
//             </Paper>
//         </div>
//     );
// }
  

// const DND = () => {
//     const [items, setItems] = useState(defaultItems);
//     const [movedItems, setMovedItems] = useState([]);

//     function handleDragEnd(e) {
//         console.log(e)
//         if (e.over === null)
//             return;

//         if (e.over.id == 'droppable') {
//             const item = items.find(it => it.id == e.active.id);
//             if (!item)
//                 return;
//             setMovedItems([...movedItems, {...item, id: uuidv4().substring(0, 8)}]);
//             setItems(items.filter(it => it.id != e.active.id));    
//         }
//         else if (e.over.id == 'sourceDroppable') {
//             const item = movedItems.find(it => it.id == e.active.id);
//             if (!item)
//                 return;
//             setItems([...items, {...item, id: uuidv4().substring(0, 8)}]);
//             setMovedItems(movedItems.filter(it => it.id != e.active.id));    
//         }
//     }

//     return (
//       <DndContext onDragEnd={handleDragEnd}>
//         <Droppable id="sourceDroppable">
//             <Paper sx={{ width: '50vw', minHeight: '10vh', margin: '1em' }}>
//                 {
//                     items.map(e => <Draggable id={e.id} name={e.name}></Draggable>)
//                 }
//             </Paper>
//         </Droppable>
//         <Droppable id="droppable">
//             <Paper sx={{ width: '50vw', minHeight: '10vh', margin: '1em' }}>
//                 <Typography>Image</Typography>
//                 {
//                     movedItems.map(e => <Draggable id={e.id} name={e.name}></Draggable>)
//                 }
//             </Paper>
//         </Droppable>
//       </DndContext>
//     );  
// }

// const DND = () => {
//     const [items, setItems] = useState(defaultItems);
//     const [completedItems, setCompletedItems] = useState([]);

//     const onDragEnd = (e) => {
//         const sourceIndex = e.source.index;
//         const destinationIndex = e.destination.index;
//         console.log(e, sourceIndex, destinationIndex)
        
//         // const newItems = [...items]
//         // const tmp = newItems[sourceIndex];
//         // newItems[sourceIndex] = newItems[destinationIndex];
//         // newItems[destinationIndex] = tmp;
//         // setItems(newItems);

//         if (
//             e.source.droppableId == 'droppable-1' &&
//             e.destination.droppableId == 'droppable-2'
//         ) {
//             setCompletedItems([...completedItems, { ...items[sourceIndex], id: uuidv4() }]);
//         }
//     }

//     return (
//         <div>
//             <DragDropContext
//                 onDragEnd={onDragEnd}
//             >
//                 <Droppable droppableId="droppable-1">
//                 {
//                     (providedDroppable, snapshot) => (
//                         <div  
//                             {...providedDroppable.droppableProps}
//                             ref={providedDroppable.innerRef}
//                         >
//                             <Paper sx={{ width: '50vw', height: '30vh', margin: '1em' }}>
//                             {providedDroppable.placeholder}
//                             {
//                                 items.map((item, index) => (
//                                     <Draggable key={item.id} draggableId={item.id} index={index}>
//                                         {
//                                             (provided, snapshot) => (
//                                                 <div
//                                                     ref={provided.innerRef}
//                                                     {...provided.draggableProps}
//                                                     {...provided.dragHandleProps}
//                                                 >
//                                                     <Paper sx={{ width: '300px' }}>
//                                                         <Typography variant="h3">{item.name}</Typography>
//                                                     </Paper>
//                                                 </div>
//                                             )
//                                         }  
//                                     </Draggable>    
//                                 ))
//                             }
//                             </Paper>
//                         </div>
//                     )
//                 }
//                 </Droppable>
//                 <Droppable droppableId="droppable-2">
//                 {
//                     (providedDroppable, snapshot) => (
//                         <div  
//                             {...providedDroppable.droppableProps}
//                             ref={providedDroppable.innerRef}
//                         >
//                             <Paper sx={{ width: '50vw', height: '30vh', margin: '1em' }}>
//                             {
//                                 completedItems.map((item, index) => (
//                                     <Draggable key={item.id} draggableId={item.id} index={index}>
//                                     {
//                                         (provided, snapshot) => (
//                                             <div
//                                                 ref={provided.innerRef}
//                                                 {...provided.draggableProps}
//                                                 {...provided.dragHandleProps}
//                                             >
//                                                 <Paper sx={{ width: '300px' }}>
//                                                     <Typography variant="h3">{item.name}</Typography>
//                                                 </Paper>
//                                             </div>
//                                         )
//                                     }  
//                                     </Draggable>    
//                                 ))
//                             }
//                             {providedDroppable.placeholder}
//                             </Paper>
//                         </div>
//                     )
//                 }
//                 </Droppable>
//             </DragDropContext>
//         </div>
//     );
// }

const markdown = `
### Techical evaluations

Some text

### Key features

1. Filter
2. Exposure

\`\`\`python
import numpy as np

np.array([])
\`\`\`

`

const items = [
    {
        id: "RU2787558 C1",
        name: "Система и способ машинного обучения модели обнаружения вредоносных файлов",
        abstract: "Изобретение относится к антивирусным технологиям, а именно к обнаружению вредоносных файлов. Технический результат – обеспечение обучения модели обнаружения вредоносных файлов. Способ машинного обучения модели обнаружения вредоносных файлов за счет использования при машинном обучении модели обнаружения вредоносного файла метода обучения модели обнаружения, обеспечивающего монотонность изменения степени вредоносности файла в зависимости от изменения количества шаблонов поведения вредоносного файла, сформированных на основании анализа журнала поведения. 2 н. и 8 з.п. ф-лы, 5 ил.",
        markdown
    },
    {
        id: "RU2787558 C1",
        name: "КЛАССИФИКАЦИЯ ОКРУЖАЮЩЕГО ЗВУКА ТРАНСПОРТНОГО СРЕДСТВА ЧЕРЕЗ МАШИННОЕ ОБУЧЕНИЕ НА ОСНОВЕ НЕЙРОННЫХ СЕТЕЙ",
        abstract: "Способ по п. 3, в котором определение того, возникают ли звуки изнутри или снаружи транспортного средства, содержит этап, на котором выполняют машинное обучение аудиофайлами через первую нейронную сеть. 6. Способ по п. 3, в котором классификация звуков во множество категорий содержит этап, на котором выполняют машинное обучение аудиофайлами через вторую нейронную сеть. 7. Способ по п. 5, в котором машинное обучение аудиофайлами через первую нейронную сеть содержит этапы, на которых: обрабатывают аудиофайлы с помощью Мэл-частотного кепстрального алгоритма посредством вычисления соответствующего набора Мэл-частотных кепстральных коэффициентов для каждого из аудиофайлов; и обрабатывают Мэл-частотные кепстральные коэффициенты посредством первой нейронной сети, чтобы изучать набор характеристик соответствующего аудиофайла. 8.",
        markdown
    },
    {
        id: "RU2787558 C1",
        name: "СПОСОБ ПОИСКА ДАННЫХ ДЛЯ ЗАДАЧ МАШИННОГО ОБУЧЕНИЯ",
        abstract: "Что касается того, по какому алгоритму осуществляют машинное обучение на информационном узле владельца данных, существует несколько предпочтительных вариантов реализации настоящего изобретения. Так, в одном из предпочтительных вариантов реализации настоящего изобретения при формировании поискового запроса задают по меньшей мере один алгоритм машинного обучения; отправку поискового запроса и предоставление ответа на поисковый запрос осуществляют напрямую или через по меньшей мере один информационный узел поискового сервиса; а функцию зависимости между набором признаков и метками находят посредством обучения по заданному алгоритму.",
        markdown
    },
    {
        id: "RU2787558 C1",
        name: "СПОСОБ ИЗМЕРЕНИЯ ОКТАНОВОГО ЧИСЛА БЕНЗИНА",
        abstract: "Данный технический результат достигается тем, что способ измерения октанового числа бензина, включающий воздействие ультразвуком на бензин и сравнение результата этого воздействия с результатом такого же воздействия на бензин с заранее известным октановым числом, отличается тем, что воздействуют на бензин ультразвуком с фиксированной частотой в диапазоне от 20 до 44 кГц с образованием в нем кавитационных пузырей, фиксируют, трансформируют и оцифровывают не менее тысячи двухсот изображений кавитационных пузырей бензина с заранее известным октановым числом и на основании полученных данных проводят машинное обучение, в содержащую характерные признаки изображений кавитационных пузырей бензинов с заранее известным октановым числом обученную модель машинного обучения вводят не менее ста изображений образовавшихся в проверяемом бензине с неизвестным октановым числом кавитационных пузырей, полученных при воздействии ультразвуком такой же частоты и обработанных идентичным образом, в результате сравнения",
        markdown
    },
    {
        id: "RU2787558 C1",
        name: "СИСТЕМА И СПОСОБ АВТОМАТИЧЕСКОГО МАШИННОГО ОБУЧЕНИЯ (AUTOML) МОДЕЛЕЙ КОМПЬЮТЕРНОГО ЗРЕНИЯ ДЛЯ АНАЛИЗА БИОМЕДИЦИНСКИХ ИЗОБРАЖЕНИЙ",
        abstract: "Изобретение относится к системе и способу автоматического машинного обучения (AutoML) моделей компьютерного зрения для анализа биомедицинских изображений. Технический результат заключается в повышении точности анализа биомедицинских изображений за счет определения наиболее эффективной модели компьютерного зрения. В способе автоматически выполняют загрузку данных биомедицинских изображений, необходимых для тестирования, обучения и валидации моделей компьютерного зрения для анализа биомедицинских изображений, трансформацию данных биомедицинских изображений в формат, принимаемый для поиска, обучения и оценки, осуществляют AutoML поиск архитектур моделей компьютерного зрения для анализа биомедицинских изображений с помощью обучающей и тестовой выборок, сформированных на основе данных биомедицинских изображений, выполняют с помощью обучающей выборки обучение моделей компьютерного зрения для анализа биомедицинских изображений, имеющих найденные архитектуры, причем выбирают лучшую из указанных обученных моделей и передают выбранную модель для оценки, при этом критерием выбора лучшей модели является достижение моделью заданных значений одной или более метрик модели при тестировании модели с помощью тестовой выборки, выполняют оценку лучшей выбранной модели компьютерного зрения для анализа биомедицинских изображений с помощью валидационной выборки, сформированной на основе данных биомедицинских изображений, при этом валидационная выборка создается на основе данных, которые не представлены в тестовой или обучающей выборке. 2 н. и 8 з.п. ф-лы, 6 ил.",
        markdown
    }
]

const ItemCard = ({ item }) => {
    const [open, setOpen] = useState(false);

    return (
        <Paper sx={{
                padding: '1em',
                marginTop: '1em',
                // '&:hover': {
                //     backgroundColor: '#fbfbfb'
                // }
            }}
        >
            <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'}>
                <Chip sx={{ borderRadius: '5px' }}  variant='outlined' label={item.id}/>
                {/* <Box>
                    <EditOutlinedIcon sx={{
                        cursor: 'pointer',
                        color: 'white',
                        backgroundColor: '#000',
                        borderRadius: '5px',
                        padding: '0.05em',
                        margin: '0.05em',
                    }}/>
                    <DeleteOutlineOutlinedIcon sx={{
                        cursor: 'pointer', color: 'white', backgroundColor: '#000', borderRadius: '5px', padding: '0.05em', margin: '0.05em'
                    }}/>
                </Box> */}
            </Box>
            <Typography variant='h6' fontWeight={800} sx={{ cursor: 'pointer' }}>{item.name}</Typography>
            <Divider sx={{ marginBottom: '1em' }} />
            <Typography variant='body2' color={'grey'}>{item.abstract}</Typography>
            <Button
                variant='contained'
                sx={{
                    color: '#fff',
                    borderColor: '#b4b4b4',
                    marginTop: '1em',
                    fontWeight: '600',
                    backgroundColor: '#000',
                    boxShadow: '-4px 4px 8px 0px rgba(64, 64, 64, 0.73)',
                    // padding: '0.05em',
                    '&:hover': {
                        backgroundColor: '#000',
                    }
                }}

                onClick={() => setOpen(prev => !prev)}
            >
                Open Summary
            </Button>
            <Collapse in={open}>
                <Divider sx={{ marginTop: '1em' }} />
                <ReactMarkdown className="markdown">{item.markdown}</ReactMarkdown>
            </Collapse>
        </Paper>
    )
}



export default () => {
    return (
        <>
            {/* <DND /> */}
            <Header />
            <Box display={'flex'} justifyContent={'center'}>
                <Box width={'50%'}>
                {
                    items.map(item => <ItemCard item={item} />)
                }
                </Box>
            </Box>
        </>
    )
}
