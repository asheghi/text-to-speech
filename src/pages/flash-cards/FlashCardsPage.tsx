/* eslint-disable @typescript-eslint/no-explicit-any */
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper'

import "swiper/css"
import './flash-cards.css'
import { trpc } from '../../api';
import { useMemo, useRef, useState } from 'react';
import { WordSlide } from './components/WordSlide';

function shuffle(array: any[]) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}


export const FlashCardsPage = (): JSX.Element => {
    const swiperRef = useRef<SwiperType>();
    const [activeIndex, setActiveIndex] = useState(0)
    const wordsQuery = trpc.words.getWordsList.useQuery();
    const randomList = useMemo(() => {
        if (!wordsQuery.data) { return [] }
        const list = [...wordsQuery.data];
        shuffle(list);
        return list;
    }, [wordsQuery.data])

    if (wordsQuery.isPending) {
        return <p>Loading...</p>
    }

    if (wordsQuery.isError) {
        return <p>Error</p>
    }

    function handleSwiper(swiper: SwiperType): void {
        console.log("handle swiper called with:", swiper);

        swiperRef.current = swiper;
    }

    function handleSlideChange(swiper: SwiperType): void {
        console.log("handle slide change called with:", swiper);
        swiperRef.current = swiper;
        setActiveIndex(swiper.activeIndex)
    }

    return <div className="">
        <Swiper
            spaceBetween={24}
            slidesPerView={1}
            onSlideChange={handleSlideChange}
            onSwiper={handleSwiper}

            className=''
        >
            {randomList.map((w, index) => {
                const shouldRender = Math.abs((activeIndex ?? 0) - index) < 3
                const isActiveSlide = activeIndex === index;
                console.log({ shouldRender, index, activeIndex });

                return <SwiperSlide key={w._id}>
                    {shouldRender && <WordSlide word={w.word} isActiveSlide={isActiveSlide} />}
                </SwiperSlide>
            })}

        </Swiper>
    </div>
}