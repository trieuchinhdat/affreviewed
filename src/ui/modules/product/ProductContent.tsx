import moduleProps from '@/lib/moduleProps'
import Date from '@/ui/Date'
import TableOfContents from '@/ui/modules/RichtextModule/TableOfContents'
import Content from '@/ui/modules/RichtextModule/Content'
import { cn } from '@/lib/utils'
import css from './ProductContent.module.css'

export default function ProductContent({
	product,
	...props
}: { product?: Sanity.ProductDetail } & Sanity.Module) {
	if (!product) return null
	return (
		<article {...moduleProps(props)} className="product-template">
			<div className={cn('grid gap-8 p-4')}>
				<Content
					value={product.body}
					title={product.metadata.title}
					className={cn(css.body, 'grid max-w-screen-lg')}
				>
					<hr />
				</Content>
			</div>
		</article>
	)
}
