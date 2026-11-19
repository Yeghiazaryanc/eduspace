

export const CourseCardSkeleton:React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-full animate-pulse">
            
            {/* Նկարի հատված (դատարկ մոխրագույն բլոկ) */}
            <div className="aspect-video bg-gray-200 dark:bg-gray-800 w-full" />
            
            {/* Բովանդակություն */}
            <div className="p-5 flex-1 flex flex-col">
                {/* Վերնագիր (հաստ գիծ) */}
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-md w-3/4 mb-3" />
                
                {/* Նկարագրություն (երկու բարակ գիծ) */}
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-full mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-5/6 mb-4" />
                
                {/* Ներքևի մաս (Ամսաթիվ և Կոճակ) */}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-1/4" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-24" />
                </div>
            </div>
            
        </div>
    );
}