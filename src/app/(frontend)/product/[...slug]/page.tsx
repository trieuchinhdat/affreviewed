import { notFound } from 'next/navigation'
import Modules from '@/ui/modules'
import processMetadata from '@/lib/processMetadata'
import { client } from '@/sanity/lib/client'
import { groq } from 'next-sanity'
import { fetchSanityLive } from '@/sanity/lib/fetch'
import {
	MODULES_QUERY,
	GLOBAL_MODULE_PATH_QUERY,
	TRANSLATIONS_QUERY,
} from '@/sanity/lib/queries'
import { languages } from '@/lib/i18n'
import errors from '@/lib/errors'
import { PRODUCT_DIR } from '@/lib/env'

export default async function Page({ params }: Props) {
	const page = await getPage(await params)
	if (!page) notFound()
	return (
		<>
			<div className="-mt-4">
				<Modules modules={page.modules} page={page} />
			</div>
		</>
	)
}

export async function generateMetadata({ params }: Props) {
	const page = await getPage(await params)
	if (!page) notFound()
	return processMetadata(page)
}

export async function generateStaticParams() {
	const slugs = await client.fetch<{ slug: string }[]>(
		groq`*[
			_type == 'product.detail'
			&& defined(metadata.slug.current)
			&& !(metadata.slug.current in ['index'])
		]{
			'slug': metadata.slug.current
		}`,
	)

	return slugs.map(({ slug }) => ({ slug: slug.split('/') }))
}

async function getPage(params: Params) {
	const { slug, lang } = processSlug(params)

	const page = await fetchSanityLive<Sanity.Page>({
		query: groq`*[
			_type == 'product.detail'
			&& metadata.slug.current == $slug
			${lang ? `&& language == '${lang}'` : ''}
		][0]{
			...,
			'modules': (
				// global modules (before)
				*[_type == 'global-module' && path == '*'].before[]{ ${MODULES_QUERY} }
				// path modules (before)
				+ *[_type == 'global-module' && path == '${PRODUCT_DIR}/'].before[]{ ${MODULES_QUERY} }
				// page modules
				+ modules[]{ ${MODULES_QUERY} }
				// path modules (after)
				+ *[_type == 'global-module' && path == '${PRODUCT_DIR}/'].after[]{ ${MODULES_QUERY} }
				// global modules (after)
				+ *[_type == 'global-module' && path == '*'].after[]{ ${MODULES_QUERY} }
			),
			metadata {
				...,
				'ogimage': image.asset->url + '?w=1200'
			},
			${TRANSLATIONS_QUERY},
			"site": *[_type == 'site'][0]{
				ordersite->{
					idorder,
					idordername,
					idorderphone,
					idorderemail,
					idorderaddress,
					idorderproduct,
					idorderoption1,
					idorderoption2,
					urlordergform,
					idnewletteremail,
					urlnewlettergform
				}
			}
		}`,
		params: { slug },
	})

	if (slug === 'index' && !page) throw new Error(errors.missingHomepage)
	return page
}

type Params = { slug?: string[] }

type Props = {
	params: Promise<Params>
}

function processSlug(params: Params) {
	const lang =
		params.slug && languages.includes(params.slug[0])
			? params.slug[0]
			: undefined

	if (params.slug === undefined)
		return {
			slug: 'index',
			lang,
		}

	const slug = params.slug.join('/')

	if (lang) {
		const processed = slug.replace(new RegExp(`^${lang}/?`), '')

		return {
			slug: processed === '' ? 'index' : processed,
			lang,
		}
	}

	return { slug }
}
