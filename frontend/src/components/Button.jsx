import React from 'react'

const Button = ({
    type='',
    text = "",
    className = '',
    textsize = 'text-[12px]',
    bg = 'bg-dark-blue',
    rounded = 'rounded-md',
    py = 'py-0.4',
    px = 'px-4.5',
    ...props
}) => {
  return (
    <div>
        <button type={type} className={`
            ${py}
            ${px}
            ${textsize}
            hover:shadow-sm hover:shadow-blue-950
            font-alef
            ${bg}
            text-bright-gray
            ${rounded}
            ${className}`}
            {...props}>
                {text}
        </button>
    </div>
  )
}

export default Button