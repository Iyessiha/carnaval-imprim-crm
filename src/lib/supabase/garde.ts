// Garde-fou des écritures Supabase.
//
// Problème traité : avec la sécurité par ligne (RLS), un UPDATE ou un DELETE refusé ne
// renvoie PAS d'erreur, juste « 0 ligne modifiée ». L'écran se comportait alors comme si
// tout avait réussi alors que rien n'était enregistré. Beaucoup d'écritures du code
// ignorent aussi totalement le résultat (`await sb.from('x').delete()...`).
//
// Ce wrapper entoure le client Supabase :
//  1. update/delete ciblant un `id` : on demande à la base de renvoyer les lignes écrites ;
//     si aucune n'est renvoyée, le résultat devient une erreur explicite.
//  2. toute écriture (insert/update/delete/upsert/rpc) en erreur que le code appelant n'a
//     PAS lue (`.error` jamais consulté) déclenche un message rouge visible à l'écran.
//  Le code qui lit déjà `error` garde son propre affichage (pas de doublon).

type Etat = {
  type: string          // insert | update | delete | upsert | rpc
  idCible: boolean      // filtre .eq('id', …) présent
  avecSelect: boolean   // l'appelant demande déjà les lignes retournées
}

export const MESSAGE_REFUS =
  "Modification refusée par la base de données : rien n'a été enregistré. " +
  "Votre compte est peut-être désactivé ou n'a pas le droit de modifier cette donnée — contactez l'administrateur."

const ECRITURES = ['insert', 'update', 'delete', 'upsert']

/** Message rouge non bloquant, affiché en bas de l'écran. */
export function notifier(message: string) {
  if (typeof document === 'undefined') return
  const texte = '⚠️ ' + message
  const existants = Array.from(document.querySelectorAll('[data-garde-toast]'))
  if (existants.some(e => e.textContent === texte)) return
  const el = document.createElement('div')
  el.setAttribute('role', 'alert')
  el.setAttribute('data-garde-toast', '1')
  el.textContent = texte
  Object.assign(el.style, {
    position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: '76px', zIndex: '9999',
    maxWidth: 'min(92vw, 540px)', background: '#D14343', color: '#fff', padding: '12px 16px',
    borderRadius: '12px', fontSize: '13px', fontWeight: '600', lineHeight: '1.4',
    boxShadow: '0 8px 24px rgba(0,0,0,.25)', cursor: 'pointer',
  })
  el.onclick = () => el.remove()
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 10000)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function surveiller(res: any, etat: Etat): any {
  if (!res || typeof res !== 'object') return res
  let erreur = res.error ?? null
  const ecriture = ECRITURES.includes(etat.type)

  if (ecriture && !erreur) {
    // UPDATE/DELETE sur un id précis qui ne touche aucune ligne = refus silencieux (RLS)
    if ((etat.type === 'update' || etat.type === 'delete') && etat.idCible
        && Array.isArray(res.data) && res.data.length === 0) {
      erreur = { message: MESSAGE_REFUS, code: 'AUCUNE_LIGNE', details: null, hint: null }
    }
  } else if (ecriture && erreur && erreur.code === 'PGRST116' && (etat.type === 'update' || etat.type === 'delete')) {
    // .single() après une écriture qui n'a rien touché : message plus clair
    erreur = { ...erreur, message: MESSAGE_REFUS }
  }

  let lu = false
  const sortie = { ...res }
  if (erreur) sortie.data = null
  Object.defineProperty(sortie, 'error', {
    enumerable: true, configurable: true,
    get() { lu = true; return erreur },
  })
  if (erreur) {
    setTimeout(() => {
      // Le code appelant n'a jamais regardé l'erreur → l'utilisateur doit être prévenu
      if (!lu) notifier(erreur.code === 'AUCUNE_LIGNE' || erreur.message === MESSAGE_REFUS
        ? MESSAGE_REFUS : 'Enregistrement impossible : ' + (erreur.message || 'erreur inconnue'))
    }, 0)
  }
  return sortie
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function envelopper(builder: any, etat: Etat): any {
  return new Proxy(builder, {
    get(cible, prop) {
      if (prop === 'then') {
        return (onOk?: unknown, onKo?: unknown) => {
          let q = cible
          // Forcer le retour des lignes écrites pour pouvoir détecter « 0 ligne »
          if ((etat.type === 'update' || etat.type === 'delete') && etat.idCible && !etat.avecSelect) {
            q = cible.select('id')
          }
          return q.then((res: unknown) => surveiller(res, etat)).then(onOk, onKo)
        }
      }
      const v = Reflect.get(cible, prop, cible)
      if (typeof v !== 'function') return v
      return (...args: unknown[]) => {
        if (prop === 'select') etat.avecSelect = true
        if (prop === 'eq' && args[0] === 'id') etat.idCible = true
        const r = v.apply(cible, args)
        return r && typeof r === 'object' && typeof r.then === 'function' ? envelopper(r, etat) : r
      }
    },
  })
}

/** Entoure un client Supabase (navigateur) avec le garde-fou d'écriture. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function proteger(client: any): any {
  return new Proxy(client, {
    get(cible, prop) {
      const v = Reflect.get(cible, prop, cible)
      if (typeof v !== 'function') return v
      if (prop === 'from') {
        return (table: string) => {
          const qb = v.call(cible, table)
          return new Proxy(qb, {
            get(q, m) {
              const f = Reflect.get(q, m, q)
              if (typeof f !== 'function') return f
              if (typeof m === 'string' && ECRITURES.includes(m)) {
                return (...args: unknown[]) =>
                  envelopper(f.apply(q, args), { type: m, idCible: false, avecSelect: false })
              }
              return f.bind(q)
            },
          })
        }
      }
      if (prop === 'rpc') {
        return (...args: unknown[]) =>
          envelopper(v.apply(cible, args), { type: 'rpc', idCible: false, avecSelect: true })
      }
      return v.bind(cible)
    },
  })
}
