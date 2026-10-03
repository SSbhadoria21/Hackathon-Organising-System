import React from 'react'

const Input = ({
    placeholder="",
    type="text",
    id="",
    className="",
    ...props
}) => {
    return (
        <div>
            <input id={id} type={type} placeholder={placeholder} className={`placeholder:text-xs placeholder:italic placeholder:font-space bg-white rounded-full px-3 font-space text-xs py-2 w-70 shadow-md shadow-black/40 focus:outline-none focus:bg-[#f1f6e6] ${className}`} {...props}/>
        </div>
    )
}

export default Input